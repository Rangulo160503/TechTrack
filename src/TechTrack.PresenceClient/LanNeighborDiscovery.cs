using System.Diagnostics;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;

namespace TechTrack.PresenceClient;

/// <summary>
/// Discovers LAN neighbors without apps on those devices (home WiFi).
/// Fast path: ARP table + short ping sweep + mDNS. Optional timed SendARP fill-in.
/// </summary>
public sealed partial class LanNeighborDiscovery(ILogger<LanNeighborDiscovery> logger)
{
    public async Task<IReadOnlyList<SelfHostInfo>> DiscoverAsync(
        SelfHostInfo self,
        int pingTimeoutMs,
        int maxConcurrent,
        CancellationToken cancellationToken)
    {
        var byIp = new Dictionary<string, SelfHostInfo>(StringComparer.Ordinal);

        void Upsert(string ip, string? mac, string? hostname, string? vendorHint)
        {
            if (string.IsNullOrWhiteSpace(ip) || ip == self.IpAddress)
            {
                return;
            }

            if (!IPAddress.TryParse(ip, out _) || !IsUnicastLanIp(ip))
            {
                return;
            }

            if (!byIp.TryGetValue(ip, out var existing))
            {
                byIp[ip] = new SelfHostInfo(ip, mac, hostname ?? ip, vendorHint);
                return;
            }

            byIp[ip] = existing with
            {
                MacAddress = existing.MacAddress ?? mac,
                Hostname = IsBetterHostname(hostname, existing.Hostname) ? hostname! : existing.Hostname,
                Vendor = existing.Vendor ?? vendorHint
            };
        }

        var subnetHosts = EnumerateSubnetHosts(self.IpAddress).ToList();
        logger.LogInformation(
            "Neighbor scan around {Self} ({Count} addresses)",
            self.IpAddress,
            subnetHosts.Count);

        MergeArpTable(Upsert);

        await PingSweepBestEffortAsync(subnetHosts, pingTimeoutMs, maxConcurrent, cancellationToken);
        MergeArpTable(Upsert);

        await TimedSendArpFillAsync(subnetHosts, byIp, Upsert, cancellationToken);
        MergeArpTable(Upsert);

        await MdnsPeekAsync(Upsert, cancellationToken);

        var results = byIp.Values
            .Select(h => h with { Vendor = h.Vendor ?? GuessVendor(h.MacAddress) })
            .OrderBy(h => h.IpAddress, StringComparer.Ordinal)
            .ToList();

        logger.LogInformation("Neighbor scan found {Count} host(s)", results.Count);
        return results;
    }

    private static bool IsBetterHostname(string? candidate, string? current) =>
        !string.IsNullOrWhiteSpace(candidate)
        && (string.IsNullOrWhiteSpace(current)
            || current == candidate
            || IPAddress.TryParse(current, out _));

    private static async Task TimedSendArpFillAsync(
        IReadOnlyList<string> hosts,
        Dictionary<string, SelfHostInfo> already,
        Action<string, string?, string?, string?> upsert,
        CancellationToken cancellationToken)
    {
        // Only probe IPs we don't already know, with a hard budget so the cycle stays responsive.
        var missing = hosts.Where(ip => !already.ContainsKey(ip)).ToList();
        using var budget = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        budget.CancelAfter(TimeSpan.FromSeconds(8));

        using var gate = new SemaphoreSlim(32);
        try
        {
            var tasks = missing.Select(async ip =>
            {
                if (budget.IsCancellationRequested)
                {
                    return;
                }

                await gate.WaitAsync(budget.Token);
                try
                {
                    var mac = await Task.Run(() =>
                    {
                        TrySendArp(ip, out var value);
                        return value;
                    }, budget.Token);

                    if (mac is not null)
                    {
                        upsert(ip, mac, null, GuessVendor(mac));
                    }
                }
                catch (OperationCanceledException)
                {
                }
                finally
                {
                    gate.Release();
                }
            });

            await Task.WhenAll(tasks);
        }
        catch (OperationCanceledException)
        {
        }
    }

    private static async Task PingSweepBestEffortAsync(
        IReadOnlyList<string> hosts,
        int pingTimeoutMs,
        int maxConcurrent,
        CancellationToken cancellationToken)
    {
        using var gate = new SemaphoreSlim(Math.Clamp(maxConcurrent, 8, 128));
        var tasks = hosts.Select(async ip =>
        {
            await gate.WaitAsync(cancellationToken);
            try
            {
                using var ping = new Ping();
                await ping.SendPingAsync(ip, Math.Clamp(pingTimeoutMs, 50, 500));
            }
            catch (PingException)
            {
            }
            finally
            {
                gate.Release();
            }
        });

        await Task.WhenAll(tasks);
    }

    private static void MergeArpTable(Action<string, string?, string?, string?> upsert)
    {
        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = "arp",
                Arguments = "-a",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = Process.Start(startInfo);
            if (process is null)
            {
                return;
            }

            var output = process.StandardOutput.ReadToEnd();
            process.WaitForExit(5000);

            foreach (Match match in ArpLineRegex().Matches(output))
            {
                var ip = match.Groups["ip"].Value;
                if (!IsUnicastLanIp(ip))
                {
                    continue;
                }

                var mac = match.Groups["mac"].Value.Replace('-', ':').ToUpperInvariant();
                if (mac is "00:00:00:00:00:00" or "FF:FF:FF:FF:FF:FF")
                {
                    continue;
                }

                upsert(ip, mac, null, GuessVendor(mac));
            }
        }
        catch
        {
            // Best-effort.
        }
    }

    private static async Task MdnsPeekAsync(
        Action<string, string?, string?, string?> upsert,
        CancellationToken cancellationToken)
    {
        try
        {
            using var udp = new UdpClient(AddressFamily.InterNetwork);
            udp.Client.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.ReuseAddress, true);
            udp.ExclusiveAddressUse = false;
            udp.Client.Bind(new IPEndPoint(IPAddress.Any, 0));
            udp.JoinMulticastGroup(IPAddress.Parse("224.0.0.251"));

            var query = BuildDnsSdBrowseQuery();
            await udp.SendAsync(query, new IPEndPoint(IPAddress.Parse("224.0.0.251"), 5353), cancellationToken);

            var deadline = DateTime.UtcNow.AddMilliseconds(1500);
            while (DateTime.UtcNow < deadline && !cancellationToken.IsCancellationRequested)
            {
                if (udp.Available <= 0)
                {
                    await Task.Delay(40, cancellationToken);
                    continue;
                }

                var result = await udp.ReceiveAsync(cancellationToken);
                var ip = result.RemoteEndPoint.Address;
                if (ip.IsIPv4MappedToIPv6)
                {
                    ip = ip.MapToIPv4();
                }

                var name = TryExtractFirstDnsName(result.Buffer);
                upsert(ip.ToString(), null, name, name is not null ? "mDNS" : null);
            }
        }
        catch (Exception)
        {
            // Optional.
        }
    }

    private static byte[] BuildDnsSdBrowseQuery() =>
    [
        0x00, 0x00,
        0x00, 0x00,
        0x00, 0x01,
        0x00, 0x00,
        0x00, 0x00,
        0x00, 0x00,
        0x09, (byte)'_', (byte)'s', (byte)'e', (byte)'r', (byte)'v', (byte)'i', (byte)'c', (byte)'e', (byte)'s',
        0x07, (byte)'_', (byte)'d', (byte)'n', (byte)'s', (byte)'-', (byte)'s', (byte)'d',
        0x04, (byte)'_', (byte)'u', (byte)'d', (byte)'p',
        0x05, (byte)'l', (byte)'o', (byte)'c', (byte)'a', (byte)'l',
        0x00,
        0x00, 0x0c,
        0x00, 0x01
    ];

    private static string? TryExtractFirstDnsName(byte[] buffer)
    {
        try
        {
            var text = Encoding.ASCII.GetString(buffer);
            var idx = text.IndexOf(".local", StringComparison.OrdinalIgnoreCase);
            if (idx <= 0)
            {
                return null;
            }

            var start = idx;
            while (start > 0
                   && text[start - 1] is (>= 'a' and <= 'z') or (>= 'A' and <= 'Z') or (>= '0' and <= '9') or '-' or '_')
            {
                start--;
            }

            var name = text[start..(idx + ".local".Length)];
            return name.Length > 6 ? name : null;
        }
        catch
        {
            return null;
        }
    }

    private static IEnumerable<string> EnumerateSubnetHosts(string selfIp)
    {
        if (!IPAddress.TryParse(selfIp, out var address))
        {
            yield break;
        }

        var bytes = address.GetAddressBytes();
        for (var host = 1; host <= 254; host++)
        {
            if (bytes[3] == host)
            {
                continue;
            }

            yield return $"{bytes[0]}.{bytes[1]}.{bytes[2]}.{host}";
        }
    }

    private static bool IsUnicastLanIp(string ip)
    {
        if (!IPAddress.TryParse(ip, out var address)
            || address.AddressFamily != AddressFamily.InterNetwork
            || IPAddress.IsLoopback(address))
        {
            return false;
        }

        var b = address.GetAddressBytes();
        // Skip multicast/reserved (224+) and broadcast-ish.
        if (b[0] >= 224)
        {
            return false;
        }

        return true;
    }

    private static bool TrySendArp(string ip, out string? mac)
    {
        mac = null;
        if (!IPAddress.TryParse(ip, out var address))
        {
            return false;
        }

        var dest = BitConverter.ToUInt32(address.GetAddressBytes(), 0);
        var macBytes = new byte[6];
        var length = (uint)macBytes.Length;
        var result = SendARP(dest, 0, macBytes, ref length);
        if (result != 0 || length < 6 || macBytes.All(b => b == 0))
        {
            return false;
        }

        mac = string.Join(':', macBytes.Select(b => b.ToString("X2")));
        return true;
    }

    private static string? GuessVendor(string? mac)
    {
        if (string.IsNullOrWhiteSpace(mac) || mac.Length < 8)
        {
            return null;
        }

        var oui = mac.Replace(":", string.Empty, StringComparison.Ordinal)
            .Replace("-", string.Empty, StringComparison.Ordinal)
            .ToUpperInvariant();
        if (oui.Length < 6)
        {
            return null;
        }

        var prefix = oui[..6];
        string[] apple =
        [
            "F0D1A9", "ACBC32", "A4B197", "3C0754", "DC3714", "F0B479", "DCA904",
            "041E64", "7C6D62", "9803D8", "BC4CC4", "F4F15A", "1499E2", "28CFDA",
            "00CDFE", "04F7E4", "18AF61", "28E02C", "3C15C2", "40A6D9", "5CF938",
            "64B9E8", "70DEE2", "78A3E4", "80E650", "A85B78", "C82A14", "D023DB",
            "E0B52D", "F0CBA1", "FCFC48", "001451", "001E52", "002312", "002436",
            "F8FFC2", "A88F2C", "B48A0A", "D81C79", "F4D488", "3CEF8C"
        ];

        return apple.Any(a => prefix.Equals(a, StringComparison.Ordinal)) ? "Apple" : null;
    }

    [DllImport("iphlpapi.dll", ExactSpelling = true)]
    private static extern int SendARP(uint destIp, uint srcIp, byte[] macAddr, ref uint physicalAddrLen);

    [GeneratedRegex(
        @"(?<ip>\d{1,3}(?:\.\d{1,3}){3})\s+(?<mac>(?:[0-9a-fA-F]{2}[-:]){5}[0-9a-fA-F]{2})",
        RegexOptions.Compiled)]
    private static partial Regex ArpLineRegex();
}

using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;

namespace TechTrack.PresenceClient;

public sealed record SelfHostInfo(
    string IpAddress,
    string? MacAddress,
    string Hostname,
    string? Vendor = null,
    string? OsVersion = null,
    string? HardwareProfileJson = null);

public static class SelfHostResolver
{
    public static SelfHostInfo? TryResolve()
    {
        var hostname = Environment.MachineName;
        string? osVersion = null;
        string? hardwareJson = null;
        if (OperatingSystem.IsWindows())
        {
            (osVersion, hardwareJson) = SystemProfileCollector.TryCollect();
        }

        foreach (var nic in NetworkInterface.GetAllNetworkInterfaces())
        {
            if (nic.OperationalStatus != OperationalStatus.Up
                || nic.NetworkInterfaceType is NetworkInterfaceType.Loopback
                    or NetworkInterfaceType.Tunnel)
            {
                continue;
            }

            var mac = FormatMac(nic.GetPhysicalAddress());
            var props = nic.GetIPProperties();

            foreach (var uni in props.UnicastAddresses)
            {
                if (uni.Address.AddressFamily != AddressFamily.InterNetwork
                    || IPAddress.IsLoopback(uni.Address))
                {
                    continue;
                }

                return new SelfHostInfo(
                    uni.Address.ToString(),
                    mac,
                    hostname,
                    "Windows",
                    osVersion,
                    hardwareJson);
            }
        }

        return null;
    }

    private static string? FormatMac(PhysicalAddress address)
    {
        var bytes = address.GetAddressBytes();
        if (bytes.Length != 6 || bytes.All(b => b == 0))
        {
            return null;
        }

        return string.Join(':', bytes.Select(b => b.ToString("X2")));
    }
}

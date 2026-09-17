using TechTrack.Domain.Common;
using TechTrack.Domain.Events.Network;

namespace TechTrack.Domain.Entities;

/// <summary>
/// Dispositivo observado en la red local vía descubrimiento LocalSend.
/// Identidad de correlación: MAC (preferida) o IP cuando no hay MAC.
/// </summary>
public class NetworkDevice : AggregateRoot
{
    public const int IpAddressMaxLength = 45;
    public const int MacAddressMaxLength = 17;
    public const int HostnameMaxLength = 255;
    public const int VendorMaxLength = 200;
    public const int AgentIdMaxLength = 100;

    public string IpAddress { get; private set; }

    public string? MacAddress { get; private set; }

    public string? Hostname { get; private set; }

    public string? Vendor { get; private set; }

    public DateTime FirstSeenAt { get; private set; }

    public DateTime LastSeenAt { get; private set; }

    public bool IsOnline { get; private set; }

    public string LastSeenByAgentId { get; private set; }

    protected NetworkDevice()
    {
        IpAddress = null!;
        LastSeenByAgentId = null!;
    }

    private NetworkDevice(
        string ipAddress,
        string? macAddress,
        string? hostname,
        string? vendor,
        string agentId,
        DateTime seenAtUtc)
        : base(Guid.NewGuid())
    {
        IpAddress = NormalizeIp(ipAddress);
        MacAddress = NormalizeMac(macAddress);
        Hostname = Guard.AgainstTooLongOptional(hostname, HostnameMaxLength, nameof(hostname));
        Vendor = Guard.AgainstTooLongOptional(vendor, VendorMaxLength, nameof(vendor));
        LastSeenByAgentId = Guard.AgainstNullOrWhiteSpace(agentId, AgentIdMaxLength, nameof(agentId));
        FirstSeenAt = seenAtUtc;
        LastSeenAt = seenAtUtc;
        IsOnline = true;

        AddDomainEvent(new NewDeviceDetectedEvent(Id, IpAddress, MacAddress, Hostname, seenAtUtc));
    }

    public static NetworkDevice Detect(
        string ipAddress,
        string? macAddress,
        string? hostname,
        string? vendor,
        string agentId,
        DateTime seenAtUtc) =>
        new(ipAddress, macAddress, hostname, vendor, agentId, seenAtUtc);

    public void MarkSeen(
        string ipAddress,
        string? macAddress,
        string? hostname,
        string? vendor,
        string agentId,
        DateTime seenAtUtc)
    {
        IpAddress = NormalizeIp(ipAddress);

        var normalizedMac = NormalizeMac(macAddress);
        if (normalizedMac is not null)
        {
            MacAddress = normalizedMac;
        }

        Hostname = Guard.AgainstTooLongOptional(hostname, HostnameMaxLength, nameof(hostname)) ?? Hostname;
        Vendor = Guard.AgainstTooLongOptional(vendor, VendorMaxLength, nameof(vendor)) ?? Vendor;
        LastSeenByAgentId = Guard.AgainstNullOrWhiteSpace(agentId, AgentIdMaxLength, nameof(agentId));
        LastSeenAt = seenAtUtc;
        IsOnline = true;

        AddDomainEvent(new DeviceSeenEvent(Id, IpAddress, MacAddress, Hostname, seenAtUtc));
    }

    public void MarkOffline(DateTime offlineAtUtc)
    {
        if (!IsOnline)
        {
            return;
        }

        IsOnline = false;
        AddDomainEvent(new DeviceWentOfflineEvent(Id, IpAddress, MacAddress, offlineAtUtc));
    }

    public static bool TryNormalizeMacAddress(string? macAddress, out string? normalized)
    {
        try
        {
            normalized = NormalizeMac(macAddress);
            return true;
        }
        catch (ArgumentException)
        {
            normalized = null;
            return false;
        }
    }

    private static string NormalizeIp(string ipAddress) =>
        Guard.AgainstNullOrWhiteSpace(ipAddress, IpAddressMaxLength, nameof(ipAddress));

    private static string? NormalizeMac(string? macAddress)
    {
        var trimmed = Guard.AgainstTooLongOptional(macAddress, MacAddressMaxLength, nameof(macAddress));
        if (trimmed is null)
        {
            return null;
        }

        var compact = trimmed.Replace("-", string.Empty, StringComparison.Ordinal)
            .Replace(":", string.Empty, StringComparison.Ordinal)
            .Replace(".", string.Empty, StringComparison.Ordinal)
            .ToUpperInvariant();

        if (compact.Length != 12 || !compact.All(Uri.IsHexDigit))
        {
            throw new ArgumentException("MAC address format is invalid.", nameof(macAddress));
        }

        return string.Join(
            ':',
            Enumerable.Range(0, 6).Select(i => compact.Substring(i * 2, 2)));
    }
}

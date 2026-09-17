namespace TechTrack.Infrastructure.Network;

/// <summary>
/// LocalSend-compatible discovery + presence offline thresholds.
/// Replaces the former ICMP NetworkAgent approach.
/// </summary>
public sealed class LocalSendOptions
{
    public const string SectionName = "LocalSend";

    public bool Enabled { get; set; }

    /// <summary>UDP multicast group (LocalSend default).</summary>
    public string MulticastAddress { get; set; } = "224.0.0.167";

    /// <summary>UDP multicast port (LocalSend default).</summary>
    public int MulticastPort { get; set; } = 53317;

    /// <summary>
    /// HTTP port advertised to peers for /api/localsend/v2/register (Kestrel HTTP port).
    /// </summary>
    public int HttpPort { get; set; } = 5176;

    public int AnnounceIntervalSeconds { get; set; } = 5;

    public string Alias { get; set; } = "TechTrack";

    public string DeviceModel { get; set; } = "TechTrack API";

    public int OfflineAfterSeconds { get; set; } = 90;

    public int OfflineCheckIntervalSeconds { get; set; } = 15;
}

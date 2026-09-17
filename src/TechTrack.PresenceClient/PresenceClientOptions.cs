namespace TechTrack.PresenceClient;

public sealed class PresenceClientOptions
{
    public const string SectionName = "PresenceClient";

    /// <summary>Base URL of TechTrack API, e.g. http://192.168.1.10:5176</summary>
    public string ApiBaseUrl { get; set; } = "http://127.0.0.1:5176";

    /// <summary>Must match PresenceIngest:ApiKey on the API.</summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>Stable id for this machine (defaults to machine name).</summary>
    public string AgentId { get; set; } = string.Empty;

    /// <summary>Heartbeat interval while online (seconds).</summary>
    public int HeartbeatSeconds { get; set; } = 20;

    /// <summary>
    /// When true, also ARP/mDNS-scan the LAN for phones and other devices (no app on them).
    /// </summary>
    public bool ScanNeighbors { get; set; } = true;

    public int NeighborPingTimeoutMs { get; set; } = 200;

    public int MaxConcurrentProbes { get; set; } = 64;
}

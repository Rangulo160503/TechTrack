namespace TechTrack.Api.Services;

public sealed class LocalSendAnnouncementDto
{
    public string? Alias { get; set; }

    public string? Version { get; set; }

    public string? DeviceModel { get; set; }

    public string? DeviceType { get; set; }

    public string? Fingerprint { get; set; }

    public int? Port { get; set; }

    public string? Protocol { get; set; }

    public bool? Download { get; set; }

    public bool? Announce { get; set; }
}

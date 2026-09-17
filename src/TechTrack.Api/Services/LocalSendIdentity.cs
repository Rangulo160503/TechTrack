using Microsoft.Extensions.Options;
using TechTrack.Infrastructure.Network;

namespace TechTrack.Api.Services;

/// <summary>
/// Stable LocalSend fingerprint + announcement factory for this API instance.
/// </summary>
public sealed class LocalSendIdentity(IOptions<LocalSendOptions> options)
{
    public string Fingerprint { get; } = Guid.NewGuid().ToString("N");

    public bool IsSelf(string? fingerprint) =>
        string.Equals(fingerprint, Fingerprint, StringComparison.Ordinal);

    public LocalSendAnnouncementDto CreateAnnouncement(bool? announce) =>
        new()
        {
            Alias = options.Value.Alias,
            Version = "2.0",
            DeviceModel = options.Value.DeviceModel,
            DeviceType = "server",
            Fingerprint = Fingerprint,
            Port = options.Value.HttpPort,
            Protocol = "http",
            Download = false,
            Announce = announce
        };
}

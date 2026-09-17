namespace TechTrack.Infrastructure.Network;

/// <summary>
/// Shared secret for presence clients that announce themselves to the API.
/// </summary>
public sealed class PresenceIngestOptions
{
    public const string SectionName = "PresenceIngest";

    public string ApiKey { get; set; } = string.Empty;
}

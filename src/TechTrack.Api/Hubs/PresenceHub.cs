using Microsoft.AspNetCore.SignalR;

namespace TechTrack.Api.Hubs;

public sealed class PresenceHub : Hub
{
    public const string HubPath = "/hubs/presence";

    public const string DeviceUpserted = "deviceUpserted";
    public const string DeviceOffline = "deviceOffline";
    public const string Snapshot = "snapshot";
}

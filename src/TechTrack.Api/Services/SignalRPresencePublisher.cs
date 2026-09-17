using Microsoft.AspNetCore.SignalR;
using TechTrack.Api.Hubs;
using TechTrack.Application.Common.Interfaces;
using TechTrack.Application.Features.NetworkPresence.Dtos;

namespace TechTrack.Api.Services;

public sealed class SignalRPresencePublisher(IHubContext<PresenceHub> hubContext)
    : IPresenceRealtimePublisher
{
    public Task PublishDeviceUpsertedAsync(
        NetworkDeviceDto device,
        CancellationToken cancellationToken = default) =>
        hubContext.Clients.All.SendAsync(PresenceHub.DeviceUpserted, device, cancellationToken);

    public Task PublishDeviceOfflineAsync(
        NetworkDeviceDto device,
        CancellationToken cancellationToken = default) =>
        hubContext.Clients.All.SendAsync(PresenceHub.DeviceOffline, device, cancellationToken);

    public Task PublishSnapshotAsync(
        IReadOnlyList<NetworkDeviceDto> devices,
        CancellationToken cancellationToken = default) =>
        hubContext.Clients.All.SendAsync(PresenceHub.Snapshot, devices, cancellationToken);
}

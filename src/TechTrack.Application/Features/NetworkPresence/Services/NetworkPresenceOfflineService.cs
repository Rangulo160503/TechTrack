using TechTrack.Application.Common.Interfaces;
using TechTrack.Application.Features.NetworkPresence.Dtos;

namespace TechTrack.Application.Features.NetworkPresence.Services;

/// <summary>
/// Marca como offline los dispositivos cuyo LastSeenAt supera el umbral configurado
/// y publica los eventos correspondientes por SignalR.
/// </summary>
public sealed class NetworkPresenceOfflineService(
    INetworkDeviceRepository repository,
    IPresenceRealtimePublisher realtimePublisher,
    IDateTimeProvider dateTimeProvider)
{
    public async Task MarkStaleDevicesOfflineAsync(
        TimeSpan offlineAfter,
        CancellationToken cancellationToken = default)
    {
        var threshold = dateTimeProvider.UtcNow - offlineAfter;
        var stale = await repository.GetStaleOnlineAsync(threshold, cancellationToken);
        if (stale.Count == 0)
        {
            return;
        }

        var now = dateTimeProvider.UtcNow;
        foreach (var device in stale)
        {
            device.MarkOffline(now);
            await realtimePublisher.PublishDeviceOfflineAsync(device.ToDto(), cancellationToken);
        }

        await repository.SaveChangesAsync(cancellationToken);
    }
}

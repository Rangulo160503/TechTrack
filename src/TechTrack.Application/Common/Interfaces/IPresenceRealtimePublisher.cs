using TechTrack.Application.Features.NetworkPresence.Dtos;

namespace TechTrack.Application.Common.Interfaces;

public interface IPresenceRealtimePublisher
{
    Task PublishDeviceUpsertedAsync(
        NetworkDeviceDto device,
        CancellationToken cancellationToken = default);

    Task PublishDeviceOfflineAsync(
        NetworkDeviceDto device,
        CancellationToken cancellationToken = default);

    Task PublishSnapshotAsync(
        IReadOnlyList<NetworkDeviceDto> devices,
        CancellationToken cancellationToken = default);
}

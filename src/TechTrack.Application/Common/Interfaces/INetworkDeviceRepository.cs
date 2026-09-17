using TechTrack.Domain.Entities;

namespace TechTrack.Application.Common.Interfaces;

public interface INetworkDeviceRepository
{
    Task<NetworkDevice?> FindByMacAsync(string macAddress, CancellationToken cancellationToken = default);

    Task<NetworkDevice?> FindByIpAsync(string ipAddress, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<NetworkDevice>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<NetworkDevice>> GetStaleOnlineAsync(
        DateTime olderThanUtc,
        CancellationToken cancellationToken = default);

    Task AddAsync(NetworkDevice device, CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

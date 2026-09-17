using Microsoft.EntityFrameworkCore;
using TechTrack.Application.Common.Interfaces;
using TechTrack.Domain.Entities;

namespace TechTrack.Infrastructure.Persistence.Repositories;

public sealed class NetworkDeviceRepository(ApplicationDbContext dbContext) : INetworkDeviceRepository
{
    public Task<NetworkDevice?> FindByMacAsync(
        string macAddress,
        CancellationToken cancellationToken = default) =>
        dbContext.NetworkDevices
            .FirstOrDefaultAsync(d => d.MacAddress == macAddress, cancellationToken);

    public Task<NetworkDevice?> FindByIpAsync(
        string ipAddress,
        CancellationToken cancellationToken = default) =>
        dbContext.NetworkDevices
            .FirstOrDefaultAsync(d => d.IpAddress == ipAddress, cancellationToken);

    public async Task<IReadOnlyList<NetworkDevice>> GetAllAsync(
        CancellationToken cancellationToken = default) =>
        await dbContext.NetworkDevices
            .AsNoTracking()
            .Where(d => d.IsActive)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<NetworkDevice>> GetStaleOnlineAsync(
        DateTime olderThanUtc,
        CancellationToken cancellationToken = default) =>
        await dbContext.NetworkDevices
            .Where(d => d.IsActive && d.IsOnline && d.LastSeenAt < olderThanUtc)
            .ToListAsync(cancellationToken);

    public async Task AddAsync(NetworkDevice device, CancellationToken cancellationToken = default) =>
        await dbContext.NetworkDevices.AddAsync(device, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        dbContext.SaveChangesAsync(cancellationToken);
}

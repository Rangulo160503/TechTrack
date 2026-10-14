using TechTrack.Domain.Entities;

namespace TechTrack.Application.Common.Interfaces;

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> FindByHashAsync(string tokenHash, CancellationToken cancellationToken = default);

    Task AddAsync(RefreshToken token, CancellationToken cancellationToken = default);

    Task RevokeAllActiveForUserAsync(
        Guid userId,
        DateTime revokedAtUtc,
        CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

using Microsoft.EntityFrameworkCore;
using TechTrack.Application.Common.Interfaces;
using TechTrack.Domain.Entities;

namespace TechTrack.Infrastructure.Persistence.Repositories;

public sealed class RefreshTokenRepository(ApplicationDbContext dbContext) : IRefreshTokenRepository
{
    public Task<RefreshToken?> FindByHashAsync(
        string tokenHash,
        CancellationToken cancellationToken = default) =>
        dbContext.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken);

    public async Task AddAsync(RefreshToken token, CancellationToken cancellationToken = default) =>
        await dbContext.RefreshTokens.AddAsync(token, cancellationToken);

    public async Task RevokeAllActiveForUserAsync(
        Guid userId,
        DateTime revokedAtUtc,
        CancellationToken cancellationToken = default)
    {
        var active = await dbContext.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAtUtc == null)
            .ToListAsync(cancellationToken);

        foreach (var token in active)
        {
            token.Revoke(revokedAtUtc);
        }
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        dbContext.SaveChangesAsync(cancellationToken);
}

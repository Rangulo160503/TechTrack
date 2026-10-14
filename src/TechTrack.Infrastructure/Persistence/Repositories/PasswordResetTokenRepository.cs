using Microsoft.EntityFrameworkCore;
using TechTrack.Application.Common.Interfaces;
using TechTrack.Domain.Entities;

namespace TechTrack.Infrastructure.Persistence.Repositories;

public sealed class PasswordResetTokenRepository(ApplicationDbContext dbContext)
    : IPasswordResetTokenRepository
{
    public async Task AddAsync(
        PasswordResetToken token,
        CancellationToken cancellationToken = default) =>
        await dbContext.PasswordResetTokens.AddAsync(token, cancellationToken);

    public async Task InvalidateActiveForUserAsync(
        Guid userId,
        DateTime utcNow,
        CancellationToken cancellationToken = default)
    {
        var active = await dbContext.PasswordResetTokens
            .Where(t => t.UserId == userId && t.UsedAtUtc == null && t.ExpiresAtUtc > utcNow)
            .ToListAsync(cancellationToken);

        foreach (var token in active)
        {
            token.MarkUsed(utcNow);
        }
    }

    public Task<PasswordResetToken?> FindActiveByHashAsync(
        string tokenHash,
        DateTime utcNow,
        CancellationToken cancellationToken = default) =>
        dbContext.PasswordResetTokens.FirstOrDefaultAsync(
            t => t.TokenHash == tokenHash
                 && t.UsedAtUtc == null
                 && t.ExpiresAtUtc > utcNow,
            cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        dbContext.SaveChangesAsync(cancellationToken);
}

using TechTrack.Domain.Entities;

namespace TechTrack.Application.Common.Interfaces;

public interface IPasswordResetTokenRepository
{
    Task AddAsync(PasswordResetToken token, CancellationToken cancellationToken = default);

    Task InvalidateActiveForUserAsync(
        Guid userId,
        DateTime utcNow,
        CancellationToken cancellationToken = default);

    Task<PasswordResetToken?> FindActiveByHashAsync(
        string tokenHash,
        DateTime utcNow,
        CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

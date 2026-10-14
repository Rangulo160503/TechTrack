using MediatR;
using TechTrack.Application.Common.Interfaces;

namespace TechTrack.Application.Features.Auth.Commands.Logout;

public sealed class LogoutCommandHandler(
    IRefreshTokenRepository refreshTokens,
    IJwtTokenService jwt,
    IDateTimeProvider clock) : IRequestHandler<LogoutCommand, bool>
{
    public async Task<bool> Handle(LogoutCommand command, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var raw = command.Request.RefreshToken;

        if (!string.IsNullOrWhiteSpace(raw))
        {
            var hash = jwt.HashRefreshToken(raw.Trim());
            var token = await refreshTokens.FindByHashAsync(hash, cancellationToken);
            if (token is not null && token.IsActive(now))
            {
                token.Revoke(now);
                await refreshTokens.SaveChangesAsync(cancellationToken);
                return true;
            }
        }

        if (command.UserId is Guid userId && userId != Guid.Empty)
        {
            await refreshTokens.RevokeAllActiveForUserAsync(userId, now, cancellationToken);
            await refreshTokens.SaveChangesAsync(cancellationToken);
            return true;
        }

        return false;
    }
}

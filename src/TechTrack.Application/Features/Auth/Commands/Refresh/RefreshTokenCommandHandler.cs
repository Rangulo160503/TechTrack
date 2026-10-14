using MediatR;
using Microsoft.Extensions.Options;
using TechTrack.Application.Common.Interfaces;
using TechTrack.Application.Features.Auth.Dtos;
using TechTrack.Domain.Entities;
using TechTrack.Domain.Enums;

namespace TechTrack.Application.Features.Auth.Commands.Refresh;

public sealed class RefreshTokenCommandHandler(
    IUserRepository users,
    IRefreshTokenRepository refreshTokens,
    IJwtTokenService jwt,
    IDateTimeProvider clock,
    IOptions<AuthOptions> authOptions) : IRequestHandler<RefreshTokenCommand, AuthResponseDto?>
{
    public async Task<AuthResponseDto?> Handle(
        RefreshTokenCommand command,
        CancellationToken cancellationToken)
    {
        var raw = command.Request.RefreshToken?.Trim();
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        var now = clock.UtcNow;
        var hash = jwt.HashRefreshToken(raw);
        var existing = await refreshTokens.FindByHashAsync(hash, cancellationToken);
        if (existing is null)
        {
            return null;
        }

        // Reuse of a revoked token → revoke the whole family for that user.
        if (existing.IsRevoked)
        {
            await refreshTokens.RevokeAllActiveForUserAsync(existing.UserId, now, cancellationToken);
            await refreshTokens.SaveChangesAsync(cancellationToken);
            return null;
        }

        if (existing.IsExpired(now))
        {
            existing.Revoke(now);
            await refreshTokens.SaveChangesAsync(cancellationToken);
            return null;
        }

        var user = await users.FindByIdAsync(existing.UserId, cancellationToken);
        if (user is null || user.Status != UserStatus.Active || !user.IsActive)
        {
            existing.Revoke(now);
            await refreshTokens.SaveChangesAsync(cancellationToken);
            return null;
        }

        var newRaw = jwt.CreateRefreshToken();
        var newHash = jwt.HashRefreshToken(newRaw);
        var refreshDays = Math.Max(1, authOptions.Value.Jwt.RefreshTokenDays);
        var refreshExpires = now.AddDays(refreshDays);

        existing.Revoke(now, newHash);
        await refreshTokens.AddAsync(
            new RefreshToken(user.Id, newHash, now, refreshExpires, command.ClientIp),
            cancellationToken);
        await refreshTokens.SaveChangesAsync(cancellationToken);

        var access = jwt.CreateAccessToken(user);
        return new AuthResponseDto(
            user.ToDto(),
            new AuthTokensDto(access.Token, access.ExpiresAtUtc, newRaw, refreshExpires));
    }
}

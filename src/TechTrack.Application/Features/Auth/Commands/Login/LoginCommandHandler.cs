using MediatR;
using Microsoft.Extensions.Options;
using TechTrack.Application.Common.Interfaces;
using TechTrack.Application.Features.Auth.Dtos;
using TechTrack.Domain.Entities;
using TechTrack.Domain.Enums;

namespace TechTrack.Application.Features.Auth.Commands.Login;

public sealed class LoginCommandHandler(
    IUserRepository users,
    IRefreshTokenRepository refreshTokens,
    IPasswordHasher passwordHasher,
    IJwtTokenService jwt,
    IDateTimeProvider clock,
    IOptions<AuthOptions> authOptions) : IRequestHandler<LoginCommand, AuthResponseDto?>
{
    public async Task<AuthResponseDto?> Handle(LoginCommand command, CancellationToken cancellationToken)
    {
        var password = command.Request.Password ?? string.Empty;
        var login =
            FirstNonEmpty(command.Request.Email, command.Request.Username);

        if (string.IsNullOrWhiteSpace(login) || string.IsNullOrWhiteSpace(password))
        {
            return null;
        }

        var user = await users.FindByUsernameOrEmailAsync(login, cancellationToken);
        if (user is null
            || user.Status != UserStatus.Active
            || !user.IsActive
            || !passwordHasher.Verify(password, user.PasswordHash))
        {
            return null;
        }

        var now = clock.UtcNow;
        var access = jwt.CreateAccessToken(user);
        var refreshRaw = jwt.CreateRefreshToken();
        var refreshHash = jwt.HashRefreshToken(refreshRaw);
        var refreshDays = Math.Max(1, authOptions.Value.Jwt.RefreshTokenDays);
        var refreshExpires = now.AddDays(refreshDays);

        await refreshTokens.AddAsync(
            new RefreshToken(user.Id, refreshHash, now, refreshExpires, command.ClientIp),
            cancellationToken);
        await refreshTokens.SaveChangesAsync(cancellationToken);

        return new AuthResponseDto(
            user.ToDto(),
            new AuthTokensDto(access.Token, access.ExpiresAtUtc, refreshRaw, refreshExpires));
    }

    private static string FirstNonEmpty(params string?[] values)
    {
        foreach (var value in values)
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value.Trim();
            }
        }

        return string.Empty;
    }
}

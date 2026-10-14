using MediatR;
using TechTrack.Application.Common.Interfaces;
using TechTrack.Domain.Enums;

namespace TechTrack.Application.Features.Auth.Commands.ResetPassword;

public sealed class ResetPasswordCommandHandler(
    IUserRepository users,
    IPasswordResetTokenRepository resetTokens,
    IRefreshTokenRepository refreshTokens,
    IPasswordHasher passwordHasher,
    IJwtTokenService jwt,
    IDateTimeProvider clock) : IRequestHandler<ResetPasswordCommand, ResetPasswordResult>
{
    public async Task<ResetPasswordResult> Handle(
        ResetPasswordCommand command,
        CancellationToken cancellationToken)
    {
        var raw = command.Request.Token?.Trim() ?? string.Empty;
        var newPassword = command.Request.NewPassword ?? string.Empty;

        if (string.IsNullOrWhiteSpace(raw) || newPassword.Length < 8)
        {
            return new ResetPasswordResult(false, "Token inválido o contraseña demasiado corta (mín. 8).");
        }

        var now = clock.UtcNow;
        var hash = jwt.HashRefreshToken(raw);
        var token = await resetTokens.FindActiveByHashAsync(hash, now, cancellationToken);
        if (token is null)
        {
            return new ResetPasswordResult(false, "El enlace no es válido o ya venció.");
        }

        var user = await users.FindByIdAsync(token.UserId, cancellationToken);
        if (user is null || user.Status != UserStatus.Active || !user.IsActive)
        {
            return new ResetPasswordResult(false, "El enlace no es válido o ya venció.");
        }

        user.ChangePasswordHash(passwordHasher.Hash(newPassword));
        token.MarkUsed(now);
        await refreshTokens.RevokeAllActiveForUserAsync(user.Id, now, cancellationToken);
        await users.SaveChangesAsync(cancellationToken);
        await resetTokens.SaveChangesAsync(cancellationToken);
        await refreshTokens.SaveChangesAsync(cancellationToken);

        return new ResetPasswordResult(true, null);
    }
}

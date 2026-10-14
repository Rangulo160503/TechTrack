using System.Security.Cryptography;
using MediatR;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TechTrack.Application.Common.Interfaces;
using TechTrack.Domain.Entities;
using TechTrack.Domain.Enums;

namespace TechTrack.Application.Features.Auth.Commands.ForgotPassword;

public sealed class ForgotPasswordCommandHandler(
    IUserRepository users,
    IPasswordResetTokenRepository resetTokens,
    IJwtTokenService jwt,
    IEmailSender emailSender,
    IDateTimeProvider clock,
    IOptions<AuthOptions> authOptions,
    ILogger<ForgotPasswordCommandHandler> logger)
    : IRequestHandler<ForgotPasswordCommand, ForgotPasswordResult>
{
    private const string GenericMessage =
        "Si el correo está registrado, enviamos instrucciones para restablecer la contraseña.";

    public async Task<ForgotPasswordResult> Handle(
        ForgotPasswordCommand command,
        CancellationToken cancellationToken)
    {
        var email = command.Request.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
        {
            return new ForgotPasswordResult(true, GenericMessage);
        }

        var user = await users.FindByEmailAsync(email, cancellationToken);
        if (user is null || user.Status != UserStatus.Active || !user.IsActive)
        {
            return new ForgotPasswordResult(true, GenericMessage);
        }

        var now = clock.UtcNow;
        var hours = Math.Clamp(authOptions.Value.Email.ResetTokenHours, 1, 48);
        var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
        var hash = jwt.HashRefreshToken(rawToken);

        await resetTokens.InvalidateActiveForUserAsync(user.Id, now, cancellationToken);
        await resetTokens.AddAsync(
            new PasswordResetToken(user.Id, hash, now, now.AddHours(hours)),
            cancellationToken);
        await resetTokens.SaveChangesAsync(cancellationToken);

        var baseUrl = (authOptions.Value.Email.PublicAppBaseUrl ?? "http://127.0.0.1:5173")
            .TrimEnd('/');
        var resetUrl = $"{baseUrl}/reset-password?token={Uri.EscapeDataString(rawToken)}";

        var html =
            $"""
             <p>Hola {System.Net.WebUtility.HtmlEncode(user.Name.FirstName)},</p>
             <p>Recibimos una solicitud para restablecer tu contraseña en <strong>TechTrack</strong>.</p>
             <p><a href="{System.Net.WebUtility.HtmlEncode(resetUrl)}">Restablecer contraseña</a></p>
             <p>El enlace vence en {hours} hora(s). Si no fuiste vos, ignorá este mensaje.</p>
             """;

        if (emailSender.IsConfigured)
        {
            try
            {
                await emailSender.SendAsync(
                    user.Email.Value,
                    "TechTrack — restablecer contraseña",
                    html,
                    cancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to send password reset email to {Email}", user.Email.Value);
                return new ForgotPasswordResult(
                    false,
                    "No se pudo enviar el correo. Revisá la configuración SMTP (Auth:Email).");
            }
        }
        else
        {
            // Dev / colegio sin SMTP aún: el link queda en logs para pruebas.
            logger.LogWarning(
                "Auth:Email no configurado. Reset link para {Email}: {ResetUrl}",
                user.Email.Value,
                resetUrl);
        }

        return new ForgotPasswordResult(true, GenericMessage);
    }
}

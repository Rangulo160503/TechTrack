using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using TechTrack.Application.Common.Interfaces;

namespace TechTrack.Infrastructure.Mail;

public sealed class SmtpEmailSender(
    IOptions<AuthOptions> authOptions,
    ILogger<SmtpEmailSender> logger) : IEmailSender
{
    public bool IsConfigured
    {
        get
        {
            var email = authOptions.Value.Email;
            return email.Enabled
                   && !string.IsNullOrWhiteSpace(email.Host)
                   && !string.IsNullOrWhiteSpace(email.FromAddress);
        }
    }

    public async Task SendAsync(
        string toEmail,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
        {
            throw new InvalidOperationException("SMTP email is not configured (Auth:Email).");
        }

        var opts = authOptions.Value.Email;
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(opts.FromName, opts.FromAddress));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.Body = new TextPart("html") { Text = htmlBody };

        using var client = new SmtpClient();
        var secure = opts.UseStartTls
            ? SecureSocketOptions.StartTls
            : SecureSocketOptions.Auto;

        await client.ConnectAsync(opts.Host, opts.Port, secure, cancellationToken);

        if (!string.IsNullOrWhiteSpace(opts.Username))
        {
            await client.AuthenticateAsync(opts.Username, opts.Password, cancellationToken);
        }

        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);

        logger.LogInformation("Password-related email sent to {To}", toEmail);
    }
}

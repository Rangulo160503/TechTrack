namespace TechTrack.Application.Common.Interfaces;

public interface IEmailSender
{
    /// <summary>True when SMTP (or a configured provider) can deliver mail.</summary>
    bool IsConfigured { get; }

    Task SendAsync(
        string toEmail,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken = default);
}

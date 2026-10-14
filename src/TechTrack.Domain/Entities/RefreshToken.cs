using TechTrack.Domain.Common;

namespace TechTrack.Domain.Entities;

/// <summary>
/// Refresh token persistido (solo se guarda el hash). Rotación al usarlo.
/// </summary>
public class RefreshToken : Entity
{
    public const int TokenHashMaxLength = 128;
    public const int IpMaxLength = 45;

    public Guid UserId { get; private set; }

    public string TokenHash { get; private set; }

    public DateTime ExpiresAtUtc { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }

    public DateTime? RevokedAtUtc { get; private set; }

    public string? ReplacedByTokenHash { get; private set; }

    public string? CreatedByIp { get; private set; }

    public bool IsRevoked => RevokedAtUtc is not null;

    public bool IsExpired(DateTime utcNow) => utcNow >= ExpiresAtUtc;

    public bool IsActive(DateTime utcNow) => !IsRevoked && !IsExpired(utcNow);

    protected RefreshToken()
    {
        TokenHash = null!;
    }

    public RefreshToken(
        Guid userId,
        string tokenHash,
        DateTime createdAtUtc,
        DateTime expiresAtUtc,
        string? createdByIp = null)
        : base(Guid.NewGuid())
    {
        UserId = Guard.AgainstEmptyGuid(userId, nameof(userId));
        TokenHash = Guard.AgainstNullOrWhiteSpace(tokenHash, TokenHashMaxLength, nameof(tokenHash));
        CreatedAtUtc = createdAtUtc;
        ExpiresAtUtc = expiresAtUtc;
        CreatedByIp = Guard.AgainstTooLongOptional(createdByIp, IpMaxLength, nameof(createdByIp));
    }

    public void Revoke(DateTime revokedAtUtc, string? replacedByTokenHash = null)
    {
        if (IsRevoked)
        {
            return;
        }

        RevokedAtUtc = revokedAtUtc;
        if (!string.IsNullOrWhiteSpace(replacedByTokenHash))
        {
            ReplacedByTokenHash = Guard.AgainstNullOrWhiteSpace(
                replacedByTokenHash,
                TokenHashMaxLength,
                nameof(replacedByTokenHash));
        }
    }
}

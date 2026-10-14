using TechTrack.Domain.Common;

namespace TechTrack.Domain.Entities;

/// <summary>
/// Token de recuperación de contraseña. Solo se persiste el hash.
/// </summary>
public class PasswordResetToken : Entity
{
    public const int TokenHashMaxLength = 128;

    public Guid UserId { get; private set; }

    public string TokenHash { get; private set; }

    public DateTime ExpiresAtUtc { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }

    public DateTime? UsedAtUtc { get; private set; }

    public bool IsUsed => UsedAtUtc is not null;

    public bool IsExpired(DateTime utcNow) => utcNow >= ExpiresAtUtc;

    public bool IsActive(DateTime utcNow) => !IsUsed && !IsExpired(utcNow);

    protected PasswordResetToken()
    {
        TokenHash = null!;
    }

    public PasswordResetToken(
        Guid userId,
        string tokenHash,
        DateTime createdAtUtc,
        DateTime expiresAtUtc)
        : base(Guid.NewGuid())
    {
        UserId = Guard.AgainstEmptyGuid(userId, nameof(userId));
        TokenHash = Guard.AgainstNullOrWhiteSpace(tokenHash, TokenHashMaxLength, nameof(tokenHash));
        CreatedAtUtc = createdAtUtc;
        ExpiresAtUtc = expiresAtUtc;
    }

    public void MarkUsed(DateTime usedAtUtc)
    {
        if (IsUsed)
        {
            return;
        }

        UsedAtUtc = usedAtUtc;
    }
}

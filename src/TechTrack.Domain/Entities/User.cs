using System.Text.RegularExpressions;
using TechTrack.Domain.Common;
using TechTrack.Domain.Enums;
using TechTrack.Domain.ValueObjects;

namespace TechTrack.Domain.Entities;

/// <summary>
/// Usuario del sistema. Solo almacena el hash de la contraseña;
/// el hasheo es responsabilidad de la capa de infraestructura.
/// </summary>
public partial class User : AggregateRoot
{
    public const int UsernameMinLength = 3;
    public const int UsernameMaxLength = 50;

    public string Username { get; private set; }

    public Email Email { get; private set; }

    public PersonName Name { get; private set; }

    public string PasswordHash { get; private set; }

    public UserStatus Status { get; private set; }

    public Guid RoleId { get; private set; }

    public Role? Role { get; private set; }

    protected User()
    {
        Username = null!;
        Email = null!;
        Name = null!;
        PasswordHash = null!;
    }

    public User(string username, Email email, PersonName name, string passwordHash, Guid roleId)
        : base(Guid.NewGuid())
    {
        ArgumentNullException.ThrowIfNull(email);
        ArgumentNullException.ThrowIfNull(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(passwordHash);

        Username = ValidateUsername(username);
        Email = email;
        Name = name;
        PasswordHash = passwordHash;
        RoleId = Guard.AgainstEmptyGuid(roleId, nameof(roleId));
        Status = UserStatus.Active;
    }

    public void UpdateName(PersonName name)
    {
        ArgumentNullException.ThrowIfNull(name);
        Name = name;
    }

    public void ChangeEmail(Email email)
    {
        ArgumentNullException.ThrowIfNull(email);
        Email = email;
    }

    public void ChangePasswordHash(string passwordHash)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(passwordHash);
        PasswordHash = passwordHash;
    }

    public void AssignRole(Guid roleId)
    {
        RoleId = Guard.AgainstEmptyGuid(roleId, nameof(roleId));
        Role = null;
    }

    public void Lock()
    {
        if (Status == UserStatus.Locked)
        {
            throw new DomainException($"User '{Username}' is already locked.");
        }

        Status = UserStatus.Locked;
    }

    public void Unlock()
    {
        if (Status != UserStatus.Locked)
        {
            throw new DomainException($"User '{Username}' is not locked.");
        }

        Status = UserStatus.Active;
    }

    public void MarkAsInactive()
    {
        if (Status == UserStatus.Inactive)
        {
            throw new DomainException($"User '{Username}' is already inactive.");
        }

        Status = UserStatus.Inactive;
    }

    public void Reactivate()
    {
        if (Status != UserStatus.Inactive)
        {
            throw new DomainException($"Only inactive users can be reactivated.");
        }

        Status = UserStatus.Active;
    }

    private static string ValidateUsername(string username)
    {
        var normalized = Guard.AgainstNullOrWhiteSpace(username, UsernameMaxLength, nameof(username))
            .ToLowerInvariant();

        if (normalized.Length < UsernameMinLength || !UsernameRegex().IsMatch(normalized))
        {
            throw new ArgumentException(
                $"'{username}' is not a valid username. Expected {UsernameMinLength}-{UsernameMaxLength} " +
                "characters: lowercase letters, digits, dots, underscores or hyphens; " +
                "must start and end with a letter or digit.",
                nameof(username));
        }

        return normalized;
    }

    [GeneratedRegex(@"^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$")]
    private static partial Regex UsernameRegex();
}

using TechTrack.Domain.Common;
using TechTrack.Domain.Enums;

namespace TechTrack.Domain.Entities;

/// <summary>
/// Rol del RBAC. Mantiene su colección de permisos encapsulada:
/// solo se modifica mediante AddPermission / RemovePermission.
/// </summary>
public class Role : AggregateRoot
{
    public const int NameMaxLength = 100;
    public const int DescriptionMaxLength = 300;

    private readonly List<Permission> _permissions = [];

    public string Name { get; private set; }

    public string? Description { get; private set; }

    public RoleType Type { get; private set; }

    public IReadOnlyCollection<Permission> Permissions => _permissions.AsReadOnly();

    protected Role()
    {
        Name = null!;
    }

    public Role(string name, RoleType type, string? description = null)
        : base(Guid.NewGuid())
    {
        if (!Enum.IsDefined(type))
        {
            throw new ArgumentException($"'{type}' is not a valid role type.", nameof(type));
        }

        Name = Guard.AgainstNullOrWhiteSpace(name, NameMaxLength, nameof(name));
        Type = type;
        Description = Guard.AgainstTooLongOptional(description, DescriptionMaxLength, nameof(description));
    }

    public void Update(string name, string? description)
    {
        Name = Guard.AgainstNullOrWhiteSpace(name, NameMaxLength, nameof(name));
        Description = Guard.AgainstTooLongOptional(description, DescriptionMaxLength, nameof(description));
    }

    public void AddPermission(Permission permission)
    {
        ArgumentNullException.ThrowIfNull(permission);

        if (_permissions.Contains(permission))
        {
            throw new DomainException(
                $"Permission '{permission.Name}' is already assigned to role '{Name}'.");
        }

        _permissions.Add(permission);
    }

    public void RemovePermission(Permission permission)
    {
        ArgumentNullException.ThrowIfNull(permission);

        if (!_permissions.Remove(permission))
        {
            throw new DomainException(
                $"Permission '{permission.Name}' is not assigned to role '{Name}'.");
        }
    }
}

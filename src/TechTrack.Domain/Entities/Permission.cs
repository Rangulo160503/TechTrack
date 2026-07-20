using System.Text.RegularExpressions;
using TechTrack.Domain.Common;

namespace TechTrack.Domain.Entities;

/// <summary>
/// Permiso granular del sistema con formato "recurso.accion" (ej. assets.view, assets.manage).
/// </summary>
public partial class Permission : AggregateRoot
{
    public const int NameMaxLength = 100;
    public const int DescriptionMaxLength = 300;

    public string Name { get; private set; }

    public string? Description { get; private set; }

    protected Permission()
    {
        Name = null!;
    }

    public Permission(string name, string? description = null)
        : base(Guid.NewGuid())
    {
        Name = ValidateName(name);
        Description = Guard.AgainstTooLongOptional(description, DescriptionMaxLength, nameof(description));
    }

    public void UpdateDescription(string? description) =>
        Description = Guard.AgainstTooLongOptional(description, DescriptionMaxLength, nameof(description));

    private static string ValidateName(string name)
    {
        var normalized = Guard.AgainstNullOrWhiteSpace(name, NameMaxLength, nameof(name))
            .ToLowerInvariant();

        if (!PermissionNameRegex().IsMatch(normalized))
        {
            throw new ArgumentException(
                $"'{name}' is not a valid permission name. Expected lowercase segments " +
                "separated by dots, e.g. 'assets.view'.",
                nameof(name));
        }

        return normalized;
    }

    [GeneratedRegex(@"^[a-z]+(?:\.[a-z]+)+$")]
    private static partial Regex PermissionNameRegex();
}

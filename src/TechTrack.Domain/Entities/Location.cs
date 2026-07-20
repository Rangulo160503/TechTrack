using TechTrack.Domain.Common;
using TechTrack.Domain.ValueObjects;

namespace TechTrack.Domain.Entities;

/// <summary>
/// Ubicación física dentro de la institución (aula, laboratorio, oficina).
/// </summary>
public class Location : AggregateRoot
{
    public const int NameMaxLength = 150;
    public const int DescriptionMaxLength = 500;

    public string Name { get; private set; }

    public LocationCode Code { get; private set; }

    public string? Description { get; private set; }

    protected Location()
    {
        Name = null!;
        Code = null!;
    }

    public Location(string name, LocationCode code, string? description = null)
        : base(Guid.NewGuid())
    {
        ArgumentNullException.ThrowIfNull(code);

        Name = Guard.AgainstNullOrWhiteSpace(name, NameMaxLength, nameof(name));
        Code = code;
        Description = Guard.AgainstTooLongOptional(description, DescriptionMaxLength, nameof(description));
    }

    public void Update(string name, string? description)
    {
        Name = Guard.AgainstNullOrWhiteSpace(name, NameMaxLength, nameof(name));
        Description = Guard.AgainstTooLongOptional(description, DescriptionMaxLength, nameof(description));
    }

    public void ChangeCode(LocationCode code)
    {
        ArgumentNullException.ThrowIfNull(code);
        Code = code;
    }
}

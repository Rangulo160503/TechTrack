using TechTrack.Domain.Common;

namespace TechTrack.Domain.Entities;

/// <summary>
/// Departamento institucional (Dirección, Secretaría, Laboratorio de Cómputo, etc.).
/// </summary>
public class Department : AggregateRoot
{
    public const int NameMaxLength = 100;
    public const int DescriptionMaxLength = 500;

    public string Name { get; private set; }

    public string? Description { get; private set; }

    protected Department()
    {
        Name = null!;
    }

    public Department(string name, string? description = null)
        : base(Guid.NewGuid())
    {
        Name = Guard.AgainstNullOrWhiteSpace(name, NameMaxLength, nameof(name));
        Description = Guard.AgainstTooLongOptional(description, DescriptionMaxLength, nameof(description));
    }

    public void Update(string name, string? description)
    {
        Name = Guard.AgainstNullOrWhiteSpace(name, NameMaxLength, nameof(name));
        Description = Guard.AgainstTooLongOptional(description, DescriptionMaxLength, nameof(description));
    }
}

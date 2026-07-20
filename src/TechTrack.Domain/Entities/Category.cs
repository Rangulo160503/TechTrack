using TechTrack.Domain.Common;

namespace TechTrack.Domain.Entities;

/// <summary>
/// Categoría de activo (computadora, impresora, red, etc.).
/// </summary>
public class Category : AggregateRoot
{
    public const int NameMaxLength = 100;
    public const int DescriptionMaxLength = 500;

    public string Name { get; private set; }

    public string? Description { get; private set; }

    protected Category()
    {
        Name = null!;
    }

    public Category(string name, string? description = null)
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

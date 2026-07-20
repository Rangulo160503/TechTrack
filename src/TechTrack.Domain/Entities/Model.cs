using TechTrack.Domain.Common;

namespace TechTrack.Domain.Entities;

/// <summary>
/// Modelo específico de una marca (ej. HP ProBook 450 G10).
/// </summary>
public class Model : AggregateRoot
{
    public const int NameMaxLength = 150;
    public const int DescriptionMaxLength = 500;

    public string Name { get; private set; }

    public string? Description { get; private set; }

    public Guid BrandId { get; private set; }

    public Brand? Brand { get; private set; }

    protected Model()
    {
        Name = null!;
    }

    public Model(string name, Guid brandId, string? description = null)
        : base(Guid.NewGuid())
    {
        Name = Guard.AgainstNullOrWhiteSpace(name, NameMaxLength, nameof(name));
        BrandId = Guard.AgainstEmptyGuid(brandId, nameof(brandId));
        Description = Guard.AgainstTooLongOptional(description, DescriptionMaxLength, nameof(description));
    }

    public void Update(string name, string? description)
    {
        Name = Guard.AgainstNullOrWhiteSpace(name, NameMaxLength, nameof(name));
        Description = Guard.AgainstTooLongOptional(description, DescriptionMaxLength, nameof(description));
    }

    public void ChangeBrand(Guid brandId)
    {
        BrandId = Guard.AgainstEmptyGuid(brandId, nameof(brandId));
        Brand = null;
    }
}

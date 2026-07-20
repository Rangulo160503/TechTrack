using FluentAssertions;
using TechTrack.Domain.Entities;

namespace TechTrack.UnitTests.Domain.Entities;

public class ModelTests
{
    [Fact]
    public void Constructor_WithValidData_ShouldCreate()
    {
        var brandId = Guid.NewGuid();

        var model = new Model("ProBook 450 G10", brandId, "Laptop de trabajo");

        model.Name.Should().Be("ProBook 450 G10");
        model.BrandId.Should().Be(brandId);
    }

    [Fact]
    public void Constructor_WithEmptyBrandId_ShouldThrowArgumentException()
    {
        var act = () => new Model("ProBook 450 G10", Guid.Empty);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void ChangeBrand_WithValidId_ShouldReplaceBrand()
    {
        var model = new Model("ThinkPad L14", Guid.NewGuid());
        var newBrandId = Guid.NewGuid();

        model.ChangeBrand(newBrandId);

        model.BrandId.Should().Be(newBrandId);
    }

    [Fact]
    public void ChangeBrand_WithEmptyId_ShouldThrowArgumentException()
    {
        var model = new Model("ThinkPad L14", Guid.NewGuid());

        var act = () => model.ChangeBrand(Guid.Empty);

        act.Should().Throw<ArgumentException>();
    }
}

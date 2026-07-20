using FluentAssertions;
using TechTrack.Domain.Entities;

namespace TechTrack.UnitTests.Domain.Entities;

public class CategoryTests
{
    [Fact]
    public void Constructor_WithValidData_ShouldCreateActiveCategoryWithId()
    {
        var category = new Category("  Laptops  ", "  Equipo portátil  ");

        category.Id.Should().NotBeEmpty();
        category.Name.Should().Be("Laptops");
        category.Description.Should().Be("Equipo portátil");
        category.IsActive.Should().BeTrue();
    }

    [Fact]
    public void Constructor_WithEmptyDescription_ShouldStoreNull()
    {
        var category = new Category("Servidores", "   ");

        category.Description.Should().BeNull();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Constructor_WithInvalidName_ShouldThrowArgumentException(string name)
    {
        var act = () => new Category(name);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Constructor_WithTooLongName_ShouldThrowArgumentException()
    {
        var act = () => new Category(new string('a', Category.NameMaxLength + 1));

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Update_WithValidData_ShouldReplaceValues()
    {
        var category = new Category("Impresoras");

        category.Update("Impresoras y escáneres", "Periféricos de impresión");

        category.Name.Should().Be("Impresoras y escáneres");
        category.Description.Should().Be("Periféricos de impresión");
    }
}

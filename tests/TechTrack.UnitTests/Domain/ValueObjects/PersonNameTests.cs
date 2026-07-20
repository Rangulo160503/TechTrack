using FluentAssertions;
using TechTrack.Domain.ValueObjects;

namespace TechTrack.UnitTests.Domain.ValueObjects;

public class PersonNameTests
{
    [Fact]
    public void Constructor_WithValidParts_ShouldTrimAndExposeFullName()
    {
        var name = new PersonName("  María  ", "  Rodríguez Solano ");

        name.FirstName.Should().Be("María");
        name.LastName.Should().Be("Rodríguez Solano");
        name.FullName.Should().Be("María Rodríguez Solano");
    }

    [Theory]
    [InlineData("", "Rodríguez")]
    [InlineData("María", "")]
    [InlineData("   ", "Rodríguez")]
    public void Constructor_WithMissingParts_ShouldThrowArgumentException(string firstName, string lastName)
    {
        var act = () => new PersonName(firstName, lastName);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Constructor_WithTooLongPart_ShouldThrowArgumentException()
    {
        var act = () => new PersonName(new string('a', PersonName.MaxPartLength + 1), "Solano");

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Equals_WithSameParts_ShouldBeTrue()
    {
        var first = new PersonName("Ana", "Mora");
        var second = new PersonName("Ana", "Mora");

        first.Should().Be(second);
    }

    [Fact]
    public void Equals_WithSwappedParts_ShouldBeFalse()
    {
        var first = new PersonName("Ana", "Mora");
        var second = new PersonName("Mora", "Ana");

        first.Should().NotBe(second);
    }
}

using FluentAssertions;
using TechTrack.Domain.ValueObjects;

namespace TechTrack.UnitTests.Domain.ValueObjects;

public class LocationCodeTests
{
    [Theory]
    [InlineData("LAB-01", "LAB-01")]
    [InlineData("aula-12", "AULA-12")]
    [InlineData(" dir ", "DIR")]
    public void Constructor_WithValidCode_ShouldNormalizeToUppercase(string input, string expected)
    {
        var code = new LocationCode(input);

        code.Value.Should().Be(expected);
    }

    [Theory]
    [InlineData("")]
    [InlineData("A")]
    [InlineData("LAB 01")]
    [InlineData("-LAB")]
    [InlineData("CODE-TOO-LONG-FOR-LOCATION-01")]
    public void Constructor_WithInvalidCode_ShouldThrowArgumentException(string value)
    {
        var act = () => new LocationCode(value);

        act.Should().Throw<ArgumentException>();
    }
}

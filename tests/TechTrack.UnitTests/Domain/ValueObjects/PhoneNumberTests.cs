using FluentAssertions;
using TechTrack.Domain.ValueObjects;

namespace TechTrack.UnitTests.Domain.ValueObjects;

public class PhoneNumberTests
{
    [Theory]
    [InlineData("22334455", "22334455")]
    [InlineData("+50622334455", "+50622334455")]
    [InlineData("2233-4455", "22334455")]
    [InlineData("(506) 2233 4455", "50622334455")]
    public void Constructor_WithValidPhone_ShouldNormalize(string input, string expected)
    {
        var phone = new PhoneNumber(input);

        phone.Value.Should().Be(expected);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("1234567")]
    [InlineData("1234567890123456")]
    [InlineData("phone123")]
    [InlineData("++50622334455")]
    public void Constructor_WithInvalidPhone_ShouldThrowArgumentException(string value)
    {
        var act = () => new PhoneNumber(value);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Equals_WithSameNormalizedValue_ShouldBeTrue()
    {
        var first = new PhoneNumber("2233-4455");
        var second = new PhoneNumber("22 33 44 55");

        first.Should().Be(second);
    }
}

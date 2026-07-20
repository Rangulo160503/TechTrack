using FluentAssertions;
using TechTrack.Domain.ValueObjects;

namespace TechTrack.UnitTests.Domain.ValueObjects;

public class SerialNumberTests
{
    [Theory]
    [InlineData("5CD1234XYZ", "5CD1234XYZ")]
    [InlineData("sn-2024/001.a", "SN-2024/001.A")]
    [InlineData("  abc 123  ", "ABC 123")]
    public void Constructor_WithValidSerial_ShouldNormalizeToUppercase(string input, string expected)
    {
        var serial = new SerialNumber(input);

        serial.Value.Should().Be(expected);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("---")]
    [InlineData("serial#123")]
    public void Constructor_WithInvalidSerial_ShouldThrowArgumentException(string value)
    {
        var act = () => new SerialNumber(value);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Constructor_WithSerialLongerThanMaxLength_ShouldThrowArgumentException()
    {
        var act = () => new SerialNumber(new string('A', SerialNumber.MaxLength + 1));

        act.Should().Throw<ArgumentException>();
    }
}

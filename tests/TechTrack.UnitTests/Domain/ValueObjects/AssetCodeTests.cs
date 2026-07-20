using FluentAssertions;
using TechTrack.Domain.ValueObjects;

namespace TechTrack.UnitTests.Domain.ValueObjects;

public class AssetCodeTests
{
    [Theory]
    [InlineData("CTP-LAB1-0042", "CTP-LAB1-0042")]
    [InlineData("ctp-pc-001", "CTP-PC-001")]
    [InlineData("  A0042  ", "A0042")]
    public void Constructor_WithValidCode_ShouldNormalizeToUppercase(string input, string expected)
    {
        var code = new AssetCode(input);

        code.Value.Should().Be(expected);
    }

    [Theory]
    [InlineData("")]
    [InlineData("AB")]
    [InlineData("-ABC")]
    [InlineData("ABC-")]
    [InlineData("AB C")]
    [InlineData("AB_C")]
    [InlineData("CODE-WAY-TOO-LONG-FOR-AN-ASSET-TAG-123")]
    public void Constructor_WithInvalidCode_ShouldThrowArgumentException(string value)
    {
        var act = () => new AssetCode(value);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Equals_ShouldIgnoreCasing()
    {
        new AssetCode("ctp-001").Should().Be(new AssetCode("CTP-001"));
    }
}

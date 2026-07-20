using FluentAssertions;
using TechTrack.Domain.ValueObjects;

namespace TechTrack.UnitTests.Domain.ValueObjects;

public class EmailTests
{
    [Theory]
    [InlineData("user@example.com")]
    [InlineData("first.last@sub.domain.org")]
    [InlineData("tecnico1@mep.go.cr")]
    public void Constructor_WithValidEmail_ShouldCreateInstance(string value)
    {
        var email = new Email(value);

        email.Value.Should().Be(value.ToLowerInvariant());
    }

    [Fact]
    public void Constructor_ShouldNormalizeToLowercaseAndTrim()
    {
        var email = new Email("  Admin@CTPSantaEulalia.ED.CR  ");

        email.Value.Should().Be("admin@ctpsantaeulalia.ed.cr");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("not-an-email")]
    [InlineData("missing@domain")]
    [InlineData("@nodomain.com")]
    [InlineData("spaces in@mail.com")]
    public void Constructor_WithInvalidEmail_ShouldThrowArgumentException(string value)
    {
        var act = () => new Email(value);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Equals_ShouldIgnoreCasing()
    {
        var first = new Email("User@Example.com");
        var second = new Email("user@example.com");

        first.Should().Be(second);
    }
}

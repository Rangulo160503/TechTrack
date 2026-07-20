using FluentAssertions;
using TechTrack.Domain.Entities;

namespace TechTrack.UnitTests.Domain.Entities;

public class PermissionTests
{
    [Theory]
    [InlineData("assets.view", "assets.view")]
    [InlineData("Assets.Manage", "assets.manage")]
    [InlineData("reports.export.pdf", "reports.export.pdf")]
    public void Constructor_WithValidName_ShouldNormalizeToLowercase(string input, string expected)
    {
        var permission = new Permission(input);

        permission.Name.Should().Be(expected);
    }

    [Theory]
    [InlineData("")]
    [InlineData("assets")]
    [InlineData("assets.")]
    [InlineData(".view")]
    [InlineData("assets view")]
    [InlineData("assets.view1")]
    public void Constructor_WithInvalidName_ShouldThrowArgumentException(string name)
    {
        var act = () => new Permission(name);

        act.Should().Throw<ArgumentException>();
    }
}

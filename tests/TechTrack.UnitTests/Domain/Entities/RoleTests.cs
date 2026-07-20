using FluentAssertions;
using TechTrack.Domain.Common;
using TechTrack.Domain.Entities;
using TechTrack.Domain.Enums;

namespace TechTrack.UnitTests.Domain.Entities;

public class RoleTests
{
    private static Role CreateRole() => new("Technician", RoleType.Technician, "Soporte técnico");

    [Fact]
    public void Constructor_WithValidData_ShouldCreateWithoutPermissions()
    {
        var role = CreateRole();

        role.Name.Should().Be("Technician");
        role.Type.Should().Be(RoleType.Technician);
        role.Permissions.Should().BeEmpty();
    }

    [Fact]
    public void Constructor_WithUndefinedRoleType_ShouldThrowArgumentException()
    {
        var act = () => new Role("Ghost", (RoleType)99);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void AddPermission_ShouldExposeItInReadOnlyCollection()
    {
        var role = CreateRole();
        var permission = new Permission("assets.view");

        role.AddPermission(permission);

        role.Permissions.Should().ContainSingle().Which.Should().Be(permission);
    }

    [Fact]
    public void AddPermission_Duplicated_ShouldThrowDomainException()
    {
        var role = CreateRole();
        var permission = new Permission("assets.view");
        role.AddPermission(permission);

        var act = () => role.AddPermission(permission);

        act.Should().Throw<DomainException>()
            .WithMessage("*already assigned*");
    }

    [Fact]
    public void RemovePermission_Assigned_ShouldRemoveIt()
    {
        var role = CreateRole();
        var permission = new Permission("assets.view");
        role.AddPermission(permission);

        role.RemovePermission(permission);

        role.Permissions.Should().BeEmpty();
    }

    [Fact]
    public void RemovePermission_NotAssigned_ShouldThrowDomainException()
    {
        var role = CreateRole();

        var act = () => role.RemovePermission(new Permission("assets.view"));

        act.Should().Throw<DomainException>()
            .WithMessage("*not assigned*");
    }
}

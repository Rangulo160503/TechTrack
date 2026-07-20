using FluentAssertions;
using TechTrack.Domain.Common;
using TechTrack.Domain.Entities;
using TechTrack.Domain.Enums;
using TechTrack.Domain.ValueObjects;

namespace TechTrack.UnitTests.Domain.Entities;

public class UserTests
{
    private static User CreateUser() => new(
        "jrodriguez",
        new Email("jrodriguez@ctp.ed.cr"),
        new PersonName("Juan", "Rodríguez"),
        "hashed-password-value",
        Guid.NewGuid());

    [Fact]
    public void Constructor_WithValidData_ShouldCreateActiveUser()
    {
        var user = CreateUser();

        user.Id.Should().NotBeEmpty();
        user.Username.Should().Be("jrodriguez");
        user.Status.Should().Be(UserStatus.Active);
        user.IsActive.Should().BeTrue();
    }

    [Fact]
    public void Constructor_ShouldNormalizeUsernameToLowercase()
    {
        var user = new User(
            "JRodriguez",
            new Email("j@ctp.ed.cr"),
            new PersonName("Juan", "Rodríguez"),
            "hash",
            Guid.NewGuid());

        user.Username.Should().Be("jrodriguez");
    }

    [Theory]
    [InlineData("ab")]
    [InlineData(".starts.with.dot")]
    [InlineData("ends.with.dot.")]
    [InlineData("has space")]
    [InlineData("")]
    public void Constructor_WithInvalidUsername_ShouldThrowArgumentException(string username)
    {
        var act = () => new User(
            username,
            new Email("j@ctp.ed.cr"),
            new PersonName("Juan", "Rodríguez"),
            "hash",
            Guid.NewGuid());

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Constructor_WithNullEmail_ShouldThrowArgumentNullException()
    {
        var act = () => new User(
            "jrodriguez",
            null!,
            new PersonName("Juan", "Rodríguez"),
            "hash",
            Guid.NewGuid());

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Constructor_WithEmptyPasswordHash_ShouldThrowArgumentException()
    {
        var act = () => new User(
            "jrodriguez",
            new Email("j@ctp.ed.cr"),
            new PersonName("Juan", "Rodríguez"),
            "   ",
            Guid.NewGuid());

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Constructor_WithEmptyRoleId_ShouldThrowArgumentException()
    {
        var act = () => new User(
            "jrodriguez",
            new Email("j@ctp.ed.cr"),
            new PersonName("Juan", "Rodríguez"),
            "hash",
            Guid.Empty);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void ChangeEmail_ShouldReplaceEmail()
    {
        var user = CreateUser();

        user.ChangeEmail(new Email("nuevo@ctp.ed.cr"));

        user.Email.Value.Should().Be("nuevo@ctp.ed.cr");
    }

    [Fact]
    public void ChangePasswordHash_WithEmptyValue_ShouldThrowArgumentException()
    {
        var user = CreateUser();

        var act = () => user.ChangePasswordHash("");

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void AssignRole_ShouldReplaceRoleId()
    {
        var user = CreateUser();
        var newRoleId = Guid.NewGuid();

        user.AssignRole(newRoleId);

        user.RoleId.Should().Be(newRoleId);
    }

    [Fact]
    public void Lock_ActiveUser_ShouldSetLockedStatus()
    {
        var user = CreateUser();

        user.Lock();

        user.Status.Should().Be(UserStatus.Locked);
    }

    [Fact]
    public void Lock_AlreadyLockedUser_ShouldThrowDomainException()
    {
        var user = CreateUser();
        user.Lock();

        var act = user.Lock;

        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Unlock_LockedUser_ShouldRestoreActiveStatus()
    {
        var user = CreateUser();
        user.Lock();

        user.Unlock();

        user.Status.Should().Be(UserStatus.Active);
    }

    [Fact]
    public void Unlock_NotLockedUser_ShouldThrowDomainException()
    {
        var user = CreateUser();

        var act = user.Unlock;

        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void MarkAsInactive_ThenReactivate_ShouldRestoreActiveStatus()
    {
        var user = CreateUser();

        user.MarkAsInactive();
        user.Status.Should().Be(UserStatus.Inactive);

        user.Reactivate();
        user.Status.Should().Be(UserStatus.Active);
    }

    [Fact]
    public void Reactivate_ActiveUser_ShouldThrowDomainException()
    {
        var user = CreateUser();

        var act = user.Reactivate;

        act.Should().Throw<DomainException>();
    }
}

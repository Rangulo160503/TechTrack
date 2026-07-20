using FluentAssertions;
using TechTrack.Domain.Common;

namespace TechTrack.UnitTests.Domain.Common;

public class AuditableEntityTests
{
    private sealed class FakeAuditableEntity() : AuditableEntity(Guid.NewGuid());

    [Fact]
    public void NewEntity_ShouldBeActiveByDefault()
    {
        var entity = new FakeAuditableEntity();

        entity.IsActive.Should().BeTrue();
    }

    [Fact]
    public void Deactivate_ShouldSetIsActiveFalse()
    {
        var entity = new FakeAuditableEntity();

        entity.Deactivate();

        entity.IsActive.Should().BeFalse();
    }

    [Fact]
    public void Activate_AfterDeactivate_ShouldSetIsActiveTrue()
    {
        var entity = new FakeAuditableEntity();
        entity.Deactivate();

        entity.Activate();

        entity.IsActive.Should().BeTrue();
    }
}

using FluentAssertions;
using TechTrack.Domain.Common;

namespace TechTrack.UnitTests.Domain.Common;

public class EntityTests
{
    private sealed class FakeEntity(Guid id) : Entity(id);

    private sealed class AnotherFakeEntity(Guid id) : Entity(id);

    private sealed class TransientEntity : Entity;

    [Fact]
    public void Constructor_WithEmptyGuid_ShouldThrowArgumentException()
    {
        var act = () => new FakeEntity(Guid.Empty);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Equals_WithSameIdAndType_ShouldBeTrue()
    {
        var id = Guid.NewGuid();

        var first = new FakeEntity(id);
        var second = new FakeEntity(id);

        first.Should().Be(second);
        (first == second).Should().BeTrue();
        first.GetHashCode().Should().Be(second.GetHashCode());
    }

    [Fact]
    public void Equals_WithSameIdButDifferentType_ShouldBeFalse()
    {
        var id = Guid.NewGuid();

        var first = new FakeEntity(id);
        var second = new AnotherFakeEntity(id);

        first.Equals(second).Should().BeFalse();
    }

    [Fact]
    public void Equals_WithDifferentIds_ShouldBeFalse()
    {
        var first = new FakeEntity(Guid.NewGuid());
        var second = new FakeEntity(Guid.NewGuid());

        (first != second).Should().BeTrue();
    }

    [Fact]
    public void Equals_WithTransientEntities_ShouldBeFalse()
    {
        var first = new TransientEntity();
        var second = new TransientEntity();

        first.Equals(second).Should().BeFalse();
    }
}

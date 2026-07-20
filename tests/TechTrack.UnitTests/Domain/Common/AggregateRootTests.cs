using FluentAssertions;
using TechTrack.Domain.Common;
using TechTrack.Domain.Events;

namespace TechTrack.UnitTests.Domain.Common;

public class AggregateRootTests
{
    private sealed record FakeDomainEvent : DomainEvent;

    private sealed class FakeAggregate() : AggregateRoot(Guid.NewGuid())
    {
        public IDomainEvent Raise()
        {
            var domainEvent = new FakeDomainEvent();
            AddDomainEvent(domainEvent);
            return domainEvent;
        }
    }

    [Fact]
    public void NewAggregate_ShouldHaveNoDomainEvents()
    {
        var aggregate = new FakeAggregate();

        aggregate.DomainEvents.Should().BeEmpty();
    }

    [Fact]
    public void AddDomainEvent_ShouldExposeEventInReadOnlyCollection()
    {
        var aggregate = new FakeAggregate();

        var domainEvent = aggregate.Raise();

        aggregate.DomainEvents.Should().ContainSingle().Which.Should().Be(domainEvent);
    }

    [Fact]
    public void DomainEvent_ShouldHaveEventIdAndUtcTimestamp()
    {
        var aggregate = new FakeAggregate();

        var domainEvent = aggregate.Raise();

        domainEvent.EventId.Should().NotBeEmpty();
        domainEvent.OccurredOnUtc.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void RemoveDomainEvent_ShouldRemoveOnlyThatEvent()
    {
        var aggregate = new FakeAggregate();
        var first = aggregate.Raise();
        var second = aggregate.Raise();

        aggregate.RemoveDomainEvent(first);

        aggregate.DomainEvents.Should().ContainSingle().Which.Should().Be(second);
    }

    [Fact]
    public void ClearDomainEvents_ShouldRemoveAllEvents()
    {
        var aggregate = new FakeAggregate();
        aggregate.Raise();
        aggregate.Raise();

        aggregate.ClearDomainEvents();

        aggregate.DomainEvents.Should().BeEmpty();
    }
}

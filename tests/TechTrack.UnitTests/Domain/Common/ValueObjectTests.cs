using FluentAssertions;
using TechTrack.Domain.Common;

namespace TechTrack.UnitTests.Domain.Common;

public class ValueObjectTests
{
    private sealed class FakeMoney(decimal amount, string currency) : ValueObject
    {
        public decimal Amount { get; } = amount;

        public string Currency { get; } = currency;

        protected override IEnumerable<object?> GetEqualityComponents()
        {
            yield return Amount;
            yield return Currency;
        }
    }

    private sealed class FakeTag(string value) : ValueObject
    {
        public string Value { get; } = value;

        protected override IEnumerable<object?> GetEqualityComponents()
        {
            yield return Value;
        }
    }

    [Fact]
    public void Equals_WithSameComponents_ShouldBeTrue()
    {
        var first = new FakeMoney(100m, "CRC");
        var second = new FakeMoney(100m, "CRC");

        first.Should().Be(second);
        (first == second).Should().BeTrue();
        first.GetHashCode().Should().Be(second.GetHashCode());
    }

    [Fact]
    public void Equals_WithDifferentComponents_ShouldBeFalse()
    {
        var first = new FakeMoney(100m, "CRC");
        var second = new FakeMoney(100m, "USD");

        (first != second).Should().BeTrue();
    }

    [Fact]
    public void Equals_WithDifferentTypes_ShouldBeFalse()
    {
        var money = new FakeMoney(1m, "X");
        var tag = new FakeTag("X");

        money.Equals(tag).Should().BeFalse();
    }
}

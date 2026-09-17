using FluentAssertions;
using TechTrack.Domain.Entities;
using TechTrack.Domain.Events.Network;

namespace TechTrack.UnitTests.Domain.Entities;

public class NetworkDeviceTests
{
    [Fact]
    public void Detect_ShouldCreateOnlineDeviceAndRaiseNewDeviceDetected()
    {
        var seenAt = DateTime.UtcNow;

        var device = NetworkDevice.Detect(
            "192.168.1.20",
            "aa-bb-cc-dd-ee-ff",
            "lab-pc",
            "Dell",
            "agent-1",
            seenAt);

        device.IsOnline.Should().BeTrue();
        device.IpAddress.Should().Be("192.168.1.20");
        device.MacAddress.Should().Be("AA:BB:CC:DD:EE:FF");
        device.Hostname.Should().Be("lab-pc");
        device.DomainEvents.Should().ContainSingle(e => e is NewDeviceDetectedEvent);
    }

    [Fact]
    public void MarkSeen_ShouldUpdateLastSeenAndRaiseDeviceSeen()
    {
        var device = NetworkDevice.Detect(
            "10.0.0.5",
            null,
            null,
            null,
            "agent-1",
            DateTime.UtcNow.AddMinutes(-1));
        device.ClearDomainEvents();

        var seenAt = DateTime.UtcNow;
        device.MarkSeen("10.0.0.5", "11:22:33:44:55:66", "phone", null, "agent-2", seenAt);

        device.MacAddress.Should().Be("11:22:33:44:55:66");
        device.Hostname.Should().Be("phone");
        device.LastSeenAt.Should().Be(seenAt);
        device.LastSeenByAgentId.Should().Be("agent-2");
        device.DomainEvents.Should().ContainSingle(e => e is DeviceSeenEvent);
    }

    [Fact]
    public void MarkOffline_ShouldToggleOnlineOnce()
    {
        var device = NetworkDevice.Detect(
            "10.0.0.8",
            null,
            null,
            null,
            "agent-1",
            DateTime.UtcNow);
        device.ClearDomainEvents();

        device.MarkOffline(DateTime.UtcNow);
        device.MarkOffline(DateTime.UtcNow);

        device.IsOnline.Should().BeFalse();
        device.DomainEvents.Should().ContainSingle(e => e is DeviceWentOfflineEvent);
    }

    [Theory]
    [InlineData("not-a-mac")]
    [InlineData("aa:bb")]
    public void Detect_WithInvalidMac_ShouldThrow(string mac)
    {
        var act = () => NetworkDevice.Detect(
            "10.0.0.1",
            mac,
            null,
            null,
            "agent-1",
            DateTime.UtcNow);

        act.Should().Throw<ArgumentException>();
    }
}

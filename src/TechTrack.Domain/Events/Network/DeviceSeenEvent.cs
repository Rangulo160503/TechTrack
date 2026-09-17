using TechTrack.Domain.Events;

namespace TechTrack.Domain.Events.Network;

public sealed record DeviceSeenEvent(
    Guid DeviceId,
    string IpAddress,
    string? MacAddress,
    string? Hostname,
    DateTime SeenAtUtc) : DomainEvent;

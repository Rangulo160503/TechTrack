using TechTrack.Domain.Events;

namespace TechTrack.Domain.Events.Network;

public sealed record DeviceWentOfflineEvent(
    Guid DeviceId,
    string IpAddress,
    string? MacAddress,
    DateTime OfflineAtUtc) : DomainEvent;

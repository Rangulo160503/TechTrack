namespace TechTrack.Application.Features.NetworkPresence.Dtos;

public sealed record NetworkDeviceDto(
    Guid Id,
    string IpAddress,
    string? MacAddress,
    string? Hostname,
    string? Vendor,
    DateTime FirstSeenAt,
    DateTime LastSeenAt,
    bool IsOnline,
    string LastSeenByAgentId,
    string? OsVersion = null,
    string? HardwareProfileJson = null);

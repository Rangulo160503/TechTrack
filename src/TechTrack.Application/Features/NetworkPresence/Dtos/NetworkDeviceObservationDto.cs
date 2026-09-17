namespace TechTrack.Application.Features.NetworkPresence.Dtos;

public sealed record NetworkDeviceObservationDto(
    string IpAddress,
    string? MacAddress,
    string? Hostname,
    string? Vendor);

namespace TechTrack.Application.Features.NetworkPresence.Dtos;

public sealed record IngestNetworkPresenceRequest(
    string AgentId,
    IReadOnlyList<NetworkDeviceObservationDto> Devices);

using MediatR;
using TechTrack.Application.Features.NetworkPresence.Dtos;

namespace TechTrack.Application.Features.NetworkPresence.Commands.IngestNetworkPresence;

public sealed record IngestNetworkPresenceCommand(IngestNetworkPresenceRequest Request)
    : IRequest<IngestNetworkPresenceResult>;

public sealed record IngestNetworkPresenceResult(
    int UpsertedCount,
    int CreatedCount,
    IReadOnlyList<NetworkDeviceDto> Devices);

using MediatR;
using TechTrack.Application.Features.NetworkPresence.Dtos;

namespace TechTrack.Application.Features.NetworkPresence.Queries.GetNetworkDevices;

public sealed record GetNetworkDevicesQuery : IRequest<IReadOnlyList<NetworkDeviceDto>>;

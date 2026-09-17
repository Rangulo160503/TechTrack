using MediatR;
using TechTrack.Application.Common.Interfaces;
using TechTrack.Application.Features.NetworkPresence.Dtos;

namespace TechTrack.Application.Features.NetworkPresence.Queries.GetNetworkDevices;

public sealed class GetNetworkDevicesQueryHandler(INetworkDeviceRepository repository)
    : IRequestHandler<GetNetworkDevicesQuery, IReadOnlyList<NetworkDeviceDto>>
{
    public async Task<IReadOnlyList<NetworkDeviceDto>> Handle(
        GetNetworkDevicesQuery request,
        CancellationToken cancellationToken)
    {
        var devices = await repository.GetAllAsync(cancellationToken);
        return devices
            .OrderByDescending(d => d.IsOnline)
            .ThenByDescending(d => d.LastSeenAt)
            .Select(d => d.ToDto())
            .ToList();
    }
}

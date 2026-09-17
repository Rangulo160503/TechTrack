using TechTrack.Domain.Entities;

namespace TechTrack.Application.Features.NetworkPresence.Dtos;

public static class NetworkDeviceMappings
{
    public static NetworkDeviceDto ToDto(this NetworkDevice device) =>
        new(
            device.Id,
            device.IpAddress,
            device.MacAddress,
            device.Hostname,
            device.Vendor,
            device.FirstSeenAt,
            device.LastSeenAt,
            device.IsOnline,
            device.LastSeenByAgentId);
}

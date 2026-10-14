using MediatR;
using TechTrack.Application.Common.Interfaces;
using TechTrack.Application.Features.NetworkPresence.Dtos;
using TechTrack.Domain.Entities;

namespace TechTrack.Application.Features.NetworkPresence.Commands.IngestNetworkPresence;

public sealed class IngestNetworkPresenceCommandHandler(
    INetworkDeviceRepository repository,
    IPresenceRealtimePublisher realtimePublisher,
    IDateTimeProvider dateTimeProvider)
    : IRequestHandler<IngestNetworkPresenceCommand, IngestNetworkPresenceResult>
{
    private const int MaxDevicesPerBatch = 500;

    public async Task<IngestNetworkPresenceResult> Handle(
        IngestNetworkPresenceCommand command,
        CancellationToken cancellationToken)
    {
        var request = command.Request
            ?? throw new ArgumentNullException(nameof(command.Request));

        if (string.IsNullOrWhiteSpace(request.AgentId))
        {
            throw new ArgumentException("AgentId is required.", nameof(request.AgentId));
        }

        if (request.Devices is null)
        {
            throw new ArgumentException("Devices collection is required.", nameof(request.Devices));
        }

        if (request.Devices.Count > MaxDevicesPerBatch)
        {
            throw new ArgumentException(
                $"A single ingest batch cannot exceed {MaxDevicesPerBatch} devices.",
                nameof(request.Devices));
        }

        var seenAt = dateTimeProvider.UtcNow;
        var agentId = request.AgentId.Trim();
        var createdCount = 0;
        var results = new List<NetworkDeviceDto>();

        foreach (var observation in request.Devices)
        {
            if (observation is null || string.IsNullOrWhiteSpace(observation.IpAddress))
            {
                continue;
            }

            var device = await FindExistingAsync(observation, cancellationToken);
            if (device is null)
            {
                device = NetworkDevice.Detect(
                    observation.IpAddress,
                    observation.MacAddress,
                    observation.Hostname,
                    observation.Vendor,
                    agentId,
                    seenAt,
                    observation.OsVersion,
                    observation.HardwareProfileJson);
                await repository.AddAsync(device, cancellationToken);
                createdCount++;
            }
            else
            {
                device.MarkSeen(
                    observation.IpAddress,
                    observation.MacAddress,
                    observation.Hostname,
                    observation.Vendor,
                    agentId,
                    seenAt,
                    observation.OsVersion,
                    observation.HardwareProfileJson);
            }

            var dto = device.ToDto();
            results.Add(dto);
            await realtimePublisher.PublishDeviceUpsertedAsync(dto, cancellationToken);
        }

        await repository.SaveChangesAsync(cancellationToken);

        return new IngestNetworkPresenceResult(results.Count, createdCount, results);
    }

    private async Task<NetworkDevice?> FindExistingAsync(
        NetworkDeviceObservationDto observation,
        CancellationToken cancellationToken)
    {
        if (NetworkDevice.TryNormalizeMacAddress(observation.MacAddress, out var normalizedMac)
            && normalizedMac is not null)
        {
            var byMac = await repository.FindByMacAsync(normalizedMac, cancellationToken);
            if (byMac is not null)
            {
                return byMac;
            }
        }

        return await repository.FindByIpAsync(observation.IpAddress.Trim(), cancellationToken);
    }
}

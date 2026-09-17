using System.Net;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using TechTrack.Api.Services;
using TechTrack.Application.Features.NetworkPresence.Commands.IngestNetworkPresence;
using TechTrack.Application.Features.NetworkPresence.Dtos;

namespace TechTrack.Api.Controllers;

/// <summary>
/// LocalSend v2 HTTP discovery endpoints (replaces the old NetworkAgent ingest path).
/// Protocol: https://github.com/localsend/protocol
/// </summary>
[ApiController]
[Route("api/localsend/v2")]
public sealed class LocalSendController(
    IMediator mediator,
    LocalSendIdentity identity,
    ILogger<LocalSendController> logger) : ControllerBase
{
    [HttpGet("info")]
    [HttpPost("info")]
    public ActionResult<LocalSendAnnouncementDto> Info() =>
        Ok(identity.CreateAnnouncement(announce: null));

    [HttpPost("register")]
    public async Task<ActionResult<LocalSendAnnouncementDto>> Register(
        [FromBody] LocalSendAnnouncementDto peer,
        CancellationToken cancellationToken)
    {
        if (peer is null || identity.IsSelf(peer.Fingerprint))
        {
            return StatusCode(StatusCodes.Status412PreconditionFailed);
        }

        var ip = HttpContext.Connection.RemoteIpAddress;
        if (ip is not null)
        {
            if (ip.IsIPv4MappedToIPv6)
            {
                ip = ip.MapToIPv4();
            }

            if (!IPAddress.IsLoopback(ip))
            {
                var hostname = string.IsNullOrWhiteSpace(peer.Alias) ? null : peer.Alias.Trim();
                var vendor = BuildVendor(peer);
                await mediator.Send(
                    new IngestNetworkPresenceCommand(
                        new IngestNetworkPresenceRequest(
                            LocalSendDiscoveryService.DiscoveryAgentId,
                            [new NetworkDeviceObservationDto(ip.ToString(), null, hostname, vendor)])),
                    cancellationToken);

                logger.LogInformation("LocalSend HTTP register from {Hostname} @ {Ip}", hostname, ip);
            }
        }

        return Ok(identity.CreateAnnouncement(announce: null));
    }

    private static string? BuildVendor(LocalSendAnnouncementDto announcement)
    {
        var parts = new List<string>(2);
        if (!string.IsNullOrWhiteSpace(announcement.DeviceType))
        {
            parts.Add(announcement.DeviceType.Trim());
        }

        if (!string.IsNullOrWhiteSpace(announcement.DeviceModel))
        {
            parts.Add(announcement.DeviceModel.Trim());
        }

        return parts.Count == 0 ? "LocalSend" : string.Join(" · ", parts);
    }
}

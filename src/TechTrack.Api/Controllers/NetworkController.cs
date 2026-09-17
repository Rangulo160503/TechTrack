using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using TechTrack.Application.Features.NetworkPresence.Commands.IngestNetworkPresence;
using TechTrack.Application.Features.NetworkPresence.Dtos;
using TechTrack.Application.Features.NetworkPresence.Queries.GetNetworkDevices;
using TechTrack.Infrastructure.Network;

namespace TechTrack.Api.Controllers;

[ApiController]
[Route("api/network")]
public sealed class NetworkController(IMediator mediator) : ControllerBase
{
    public const string AgentKeyHeaderName = "X-Agent-Key";

    /// <summary>
    /// Snapshot of devices announced by PresenceClient (boot + WiFi connect).
    /// </summary>
    [HttpGet("devices")]
    [ProducesResponseType(typeof(IReadOnlyList<NetworkDeviceDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<NetworkDeviceDto>>> GetDevices(
        CancellationToken cancellationToken)
    {
        var devices = await mediator.Send(new GetNetworkDevicesQuery(), cancellationToken);
        return Ok(devices);
    }

    /// <summary>
    /// Called by TechTrack.PresenceClient when a machine boots / joins the network.
    /// </summary>
    [HttpPost("presence")]
    [EnableRateLimiting("presence-ingest")]
    [ProducesResponseType(typeof(IngestNetworkPresenceResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IngestNetworkPresenceResult>> IngestPresence(
        [FromBody] IngestNetworkPresenceRequest request,
        [FromServices] IOptions<PresenceIngestOptions> options,
        CancellationToken cancellationToken)
    {
        if (!IsValidAgentKey(Request, options.Value.ApiKey))
        {
            return Unauthorized(new { error = "Invalid or missing presence API key." });
        }

        var result = await mediator.Send(new IngestNetworkPresenceCommand(request), cancellationToken);
        return Ok(result);
    }

    private static bool IsValidAgentKey(HttpRequest request, string configuredKey)
    {
        if (string.IsNullOrWhiteSpace(configuredKey))
        {
            return false;
        }

        if (!request.Headers.TryGetValue(AgentKeyHeaderName, out var provided)
            || string.IsNullOrWhiteSpace(provided))
        {
            return false;
        }

        return FixedTimeEquals(provided.ToString(), configuredKey);
    }

    private static bool FixedTimeEquals(string left, string right)
    {
        var leftBytes = System.Text.Encoding.UTF8.GetBytes(left);
        var rightBytes = System.Text.Encoding.UTF8.GetBytes(right);

        if (leftBytes.Length != rightBytes.Length)
        {
            System.Security.Cryptography.CryptographicOperations.FixedTimeEquals(leftBytes, leftBytes);
            return false;
        }

        return System.Security.Cryptography.CryptographicOperations.FixedTimeEquals(leftBytes, rightBytes);
    }
}

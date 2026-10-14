using System.Net.Http.Json;
using Microsoft.Extensions.Options;

namespace TechTrack.PresenceClient;

public sealed class PresenceAnnounceClient(
    HttpClient httpClient,
    IOptions<PresenceClientOptions> options,
    ILogger<PresenceAnnounceClient> logger)
{
    public async Task<bool> AnnounceAsync(
        IReadOnlyList<SelfHostInfo> hosts,
        CancellationToken cancellationToken)
    {
        if (hosts.Count == 0)
        {
            return false;
        }

        var agentId = string.IsNullOrWhiteSpace(options.Value.AgentId)
            ? Environment.MachineName
            : options.Value.AgentId.Trim();

        var payload = new
        {
            agentId,
            devices = hosts.Select(host => new
            {
                ipAddress = host.IpAddress,
                macAddress = host.MacAddress,
                hostname = host.Hostname,
                vendor = host.Vendor,
                osVersion = host.OsVersion,
                hardwareProfileJson = host.HardwareProfileJson
            }).ToArray()
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "api/network/presence")
        {
            Content = JsonContent.Create(payload)
        };
        request.Headers.TryAddWithoutValidation("X-Agent-Key", options.Value.ApiKey);

        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            logger.LogWarning(
                "Presence announce failed: {Status} {Body}",
                (int)response.StatusCode,
                body);
            return false;
        }

        logger.LogInformation(
            "Announced {Count} device(s) as agent {AgentId}",
            hosts.Count,
            agentId);
        return true;
    }
}

using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using MediatR;
using Microsoft.Extensions.Options;
using TechTrack.Application.Features.NetworkPresence.Commands.IngestNetworkPresence;
using TechTrack.Application.Features.NetworkPresence.Dtos;
using TechTrack.Infrastructure.Network;

namespace TechTrack.Api.Services;

/// <summary>
/// Sole network discovery path: LocalSend v2 UDP multicast (+ HTTP register to peers).
/// See https://github.com/localsend/protocol
/// </summary>
public sealed class LocalSendDiscoveryService(
    IServiceScopeFactory scopeFactory,
    IOptions<LocalSendOptions> options,
    LocalSendIdentity identity,
    ILogger<LocalSendDiscoveryService> logger) : BackgroundService
{
    public const string DiscoveryAgentId = "localsend";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!options.Value.Enabled)
        {
            logger.LogInformation("LocalSend discovery is disabled.");
            return;
        }

        var multicastPort = options.Value.MulticastPort;
        var multicastAddress = IPAddress.Parse(options.Value.MulticastAddress);
        var announceInterval = TimeSpan.FromSeconds(
            Math.Clamp(options.Value.AnnounceIntervalSeconds, 2, 60));

        using var udp = new UdpClient(AddressFamily.InterNetwork);
        udp.Client.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.ReuseAddress, true);
        udp.ExclusiveAddressUse = false;
        udp.Client.Bind(new IPEndPoint(IPAddress.Any, multicastPort));
        udp.JoinMulticastGroup(multicastAddress);
        udp.MulticastLoopback = false;

        logger.LogInformation(
            "LocalSend discovery active on {Group}:{UdpPort}; HTTP register expected on :{HttpPort}. Open LocalSend on the same WiFi.",
            multicastAddress,
            multicastPort,
            options.Value.HttpPort);

        var listenTask = ListenLoopAsync(udp, stoppingToken);
        var announceTask = AnnounceLoopAsync(udp, multicastAddress, multicastPort, announceInterval, stoppingToken);

        await Task.WhenAll(listenTask, announceTask);
    }

    private async Task AnnounceLoopAsync(
        UdpClient udp,
        IPAddress multicastAddress,
        int multicastPort,
        TimeSpan interval,
        CancellationToken stoppingToken)
    {
        var endpoint = new IPEndPoint(multicastAddress, multicastPort);
        using var timer = new PeriodicTimer(interval);

        await SendAnnounceAsync(udp, endpoint, stoppingToken);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            await SendAnnounceAsync(udp, endpoint, stoppingToken);
        }
    }

    private async Task SendAnnounceAsync(
        UdpClient udp,
        IPEndPoint endpoint,
        CancellationToken stoppingToken)
    {
        try
        {
            var payload = identity.CreateAnnouncement(announce: true);
            var bytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(payload, JsonOptions));
            await udp.SendAsync(bytes, endpoint, stoppingToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Failed to send LocalSend multicast announce.");
        }
    }

    private async Task ListenLoopAsync(UdpClient udp, CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var result = await udp.ReceiveAsync(stoppingToken);
                await HandleDatagramAsync(result, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "LocalSend UDP receive failed.");
                await Task.Delay(500, stoppingToken);
            }
        }
    }

    private async Task HandleDatagramAsync(UdpReceiveResult result, CancellationToken cancellationToken)
    {
        var json = Encoding.UTF8.GetString(result.Buffer);
        LocalSendAnnouncementDto? announcement;
        try
        {
            announcement = JsonSerializer.Deserialize<LocalSendAnnouncementDto>(json, JsonOptions);
        }
        catch (JsonException)
        {
            return;
        }

        if (announcement is null
            || string.IsNullOrWhiteSpace(announcement.Fingerprint)
            || identity.IsSelf(announcement.Fingerprint))
        {
            return;
        }

        var remoteIp = result.RemoteEndPoint.Address;
        if (remoteIp.IsIPv4MappedToIPv6)
        {
            remoteIp = remoteIp.MapToIPv4();
        }

        await IngestPeerAsync(remoteIp.ToString(), announcement, cancellationToken);

        if (announcement.Announce == true)
        {
            _ = RegisterWithPeerAsync(remoteIp, announcement, cancellationToken);
        }
    }

    private async Task RegisterWithPeerAsync(
        IPAddress remoteIp,
        LocalSendAnnouncementDto announcement,
        CancellationToken cancellationToken)
    {
        try
        {
            var port = announcement.Port is > 0 and < 65536
                ? announcement.Port.Value
                : options.Value.MulticastPort;
            var scheme = string.Equals(announcement.Protocol, "https", StringComparison.OrdinalIgnoreCase)
                ? "https"
                : "http";
            var url = $"{scheme}://{remoteIp}:{port}/api/localsend/v2/register";

            using var handler = new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback =
                    HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
            };
            using var http = new HttpClient(handler) { Timeout = TimeSpan.FromSeconds(2) };
            var body = identity.CreateAnnouncement(announce: null);
            using var content = new StringContent(
                JsonSerializer.Serialize(body, JsonOptions),
                Encoding.UTF8,
                "application/json");

            using var response = await http.PostAsync(url, content, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                return;
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            var peer = await JsonSerializer.DeserializeAsync<LocalSendAnnouncementDto>(
                stream,
                JsonOptions,
                cancellationToken);
            if (peer is not null)
            {
                await IngestPeerAsync(remoteIp.ToString(), peer, cancellationToken);
            }
        }
        catch (Exception)
        {
            // Multicast ingest already recorded the peer when possible.
        }
    }

    private async Task IngestPeerAsync(
        string ip,
        LocalSendAnnouncementDto announcement,
        CancellationToken cancellationToken)
    {
        var hostname = string.IsNullOrWhiteSpace(announcement.Alias) ? null : announcement.Alias.Trim();
        var vendor = BuildVendor(announcement);

        using var scope = scopeFactory.CreateScope();
        var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

        var request = new IngestNetworkPresenceRequest(
            DiscoveryAgentId,
            [new NetworkDeviceObservationDto(ip, null, hostname, vendor)]);

        await mediator.Send(new IngestNetworkPresenceCommand(request), cancellationToken);
        logger.LogInformation("LocalSend peer: {Hostname} @ {Ip}", hostname ?? "(no alias)", ip);
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

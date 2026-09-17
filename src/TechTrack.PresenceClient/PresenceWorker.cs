using System.Net.NetworkInformation;
using Microsoft.Extensions.Options;

namespace TechTrack.PresenceClient;

/// <summary>
/// On boot / network connect, announces this PC and discovers LAN neighbors (phones, etc.)
/// via ARP/mDNS — no app required on those devices.
/// </summary>
public sealed class PresenceWorker(
    PresenceAnnounceClient announceClient,
    LanNeighborDiscovery neighborDiscovery,
    IOptions<PresenceClientOptions> options,
    ILogger<PresenceWorker> logger) : BackgroundService
{
    private readonly SemaphoreSlim _gate = new(1, 1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var heartbeatSeconds = Math.Clamp(options.Value.HeartbeatSeconds, 5, 300);
        logger.LogInformation(
            "TechTrack PresenceClient started. Api={Api} Heartbeat={Heartbeat}s ScanNeighbors={Scan}",
            options.Value.ApiBaseUrl,
            heartbeatSeconds,
            options.Value.ScanNeighbors);

        NetworkChange.NetworkAvailabilityChanged += OnNetworkChanged;
        NetworkChange.NetworkAddressChanged += OnNetworkChanged;

        try
        {
            await WaitForNetworkAsync(stoppingToken);
            await AnnounceSafeAsync(stoppingToken);

            using var timer = new PeriodicTimer(TimeSpan.FromSeconds(heartbeatSeconds));
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                await AnnounceSafeAsync(stoppingToken);
            }
        }
        finally
        {
            NetworkChange.NetworkAvailabilityChanged -= OnNetworkChanged;
            NetworkChange.NetworkAddressChanged -= OnNetworkChanged;
        }
    }

    private void OnNetworkChanged(object? sender, EventArgs e)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                await Task.Delay(1500);
                await AnnounceSafeAsync(CancellationToken.None);
            }
            catch (Exception ex)
            {
                logger.LogDebug(ex, "Network-change announce skipped.");
            }
        });
    }

    private static async Task WaitForNetworkAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            if (NetworkInterface.GetIsNetworkAvailable() && SelfHostResolver.TryResolve() is not null)
            {
                return;
            }

            await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
        }
    }

    private async Task AnnounceSafeAsync(CancellationToken cancellationToken)
    {
        if (!await _gate.WaitAsync(0, cancellationToken))
        {
            return;
        }

        try
        {
            var self = SelfHostResolver.TryResolve();
            if (self is null)
            {
                logger.LogDebug("No usable IPv4 interface yet; skip announce.");
                return;
            }

            var batch = new List<SelfHostInfo> { self };

            if (options.Value.ScanNeighbors)
            {
                var neighbors = await neighborDiscovery.DiscoverAsync(
                    self,
                    options.Value.NeighborPingTimeoutMs,
                    options.Value.MaxConcurrentProbes,
                    cancellationToken);
                batch.AddRange(neighbors);
            }

            await announceClient.AnnounceAsync(batch, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Presence announce cycle failed.");
        }
        finally
        {
            _gate.Release();
        }
    }
}

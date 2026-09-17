using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TechTrack.Application.Features.NetworkPresence.Services;

namespace TechTrack.Infrastructure.Network;

public sealed class NetworkPresenceOfflineMonitor(
    IServiceScopeFactory scopeFactory,
    IOptions<LocalSendOptions> options,
    ILogger<NetworkPresenceOfflineMonitor> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var intervalSeconds = Math.Max(5, options.Value.OfflineCheckIntervalSeconds);
        var offlineAfterSeconds = Math.Max(30, options.Value.OfflineAfterSeconds);
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(intervalSeconds));

        logger.LogInformation(
            "Network presence offline monitor started. Interval={Interval}s OfflineAfter={OfflineAfter}s",
            intervalSeconds,
            offlineAfterSeconds);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<NetworkPresenceOfflineService>();
                await service.MarkStaleDevicesOfflineAsync(
                    TimeSpan.FromSeconds(offlineAfterSeconds),
                    stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed while marking stale network devices offline.");
            }
        }
    }
}

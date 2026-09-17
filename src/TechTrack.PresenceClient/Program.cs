using Microsoft.Extensions.Options;
using Serilog;
using TechTrack.PresenceClient;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console()
    .WriteTo.File("logs/presence-client-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

try
{
    var builder = Host.CreateApplicationBuilder(args);

    builder.Services.AddWindowsService(options =>
    {
        options.ServiceName = "TechTrack Presence Client";
    });

    builder.Services.AddSerilog();

    builder.Services.Configure<PresenceClientOptions>(
        builder.Configuration.GetSection(PresenceClientOptions.SectionName));

    builder.Services.AddSingleton<LanNeighborDiscovery>();

    builder.Services.AddHttpClient<PresenceAnnounceClient>((sp, client) =>
    {
        var options = sp.GetRequiredService<IOptions<PresenceClientOptions>>().Value;
        var baseUrl = options.ApiBaseUrl.TrimEnd('/') + "/";
        client.BaseAddress = new Uri(baseUrl);
        client.Timeout = TimeSpan.FromSeconds(10);
    });

    builder.Services.AddHostedService<PresenceWorker>();

    var host = builder.Build();
    Log.Information("Starting TechTrack PresenceClient");
    await host.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "TechTrack PresenceClient terminated unexpectedly");
}
finally
{
    await Log.CloseAndFlushAsync();
}

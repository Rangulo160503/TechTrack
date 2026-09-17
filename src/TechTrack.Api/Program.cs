using System.Net;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Serilog;
using TechTrack.Api.Hubs;
using TechTrack.Api.Services;
using TechTrack.Application;
using TechTrack.Application.Common.Interfaces;
using TechTrack.Infrastructure;
using TechTrack.Infrastructure.Persistence;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting TechTrack API");

    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, loggerConfiguration) =>
        loggerConfiguration.ReadFrom.Configuration(context.Configuration));

    builder.Services.AddApplication();
    builder.Services.AddInfrastructure(builder.Configuration);

    builder.Services.AddSingleton<IPresenceRealtimePublisher, SignalRPresencePublisher>();
    builder.Services.AddSingleton<LocalSendIdentity>();
    builder.Services.AddHostedService<LocalSendDiscoveryService>();
    builder.Services.AddSignalR();

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("Frontend", policy =>
        {
            policy
                .SetIsOriginAllowed(origin =>
                {
                    if (string.IsNullOrWhiteSpace(origin) || !Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                    {
                        return false;
                    }

                    // Localhost + private LAN so phones on the same WiFi can open the UI.
                    if (uri.Host is "localhost" or "127.0.0.1")
                    {
                        return true;
                    }

                    if (IPAddress.TryParse(uri.Host, out var ip))
                    {
                        return IsPrivateIp(ip);
                    }

                    // Public tunnels (Opción A): browser Origin is the tunnel host.
                    return IsPublicTunnelHost(uri.Host);
                })
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
    });

    builder.Services.AddRateLimiter(options =>
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        options.AddFixedWindowLimiter("presence-ingest", limiter =>
        {
            limiter.PermitLimit = 60;
            limiter.Window = TimeSpan.FromMinutes(1);
            limiter.QueueLimit = 0;
        });
    });

    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new Microsoft.OpenApi.OpenApiInfo
        {
            Title = "TechTrack API",
            Version = "v1",
            Description = "API para la gestión de activos tecnológicos del CTP Santa Eulalia."
        });
    });

    builder.Services.AddHealthChecks();

    var app = builder.Build();

    app.UseSerilogRequestLogging();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    await EnsureDatabaseReadyAsync(app);

    app.UseCors("Frontend");

    if (!app.Environment.IsDevelopment())
    {
        app.UseHttpsRedirection();
    }

    app.UseRateLimiter();
    app.UseAuthorization();

    app.MapControllers();
    app.MapHub<PresenceHub>(PresenceHub.HubPath);
    app.MapHealthChecks("/health");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "TechTrack API terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

static async Task EnsureDatabaseReadyAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    var useInMemory = configuration.GetValue("Database:UseInMemory", false);

    if (useInMemory)
    {
        await db.Database.EnsureCreatedAsync();
        return;
    }

    if (app.Environment.IsDevelopment() || configuration.GetValue("Database:ApplyMigrationsOnStartup", false))
    {
        await db.Database.MigrateAsync();
    }
}

static bool IsPrivateIp(IPAddress ip)
{
    if (ip.IsIPv4MappedToIPv6)
    {
        ip = ip.MapToIPv4();
    }

    if (ip.AddressFamily != System.Net.Sockets.AddressFamily.InterNetwork)
    {
        return false;
    }

    var bytes = ip.GetAddressBytes();
    return bytes[0] == 10
           || (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31)
           || (bytes[0] == 192 && bytes[1] == 168);
}

static bool IsPublicTunnelHost(string host)
{
    return host.EndsWith(".trycloudflare.com", StringComparison.OrdinalIgnoreCase)
           || host.EndsWith(".ngrok-free.app", StringComparison.OrdinalIgnoreCase)
           || host.EndsWith(".ngrok.io", StringComparison.OrdinalIgnoreCase)
           || host.EndsWith(".loca.lt", StringComparison.OrdinalIgnoreCase);
}

public partial class Program;

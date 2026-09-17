using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TechTrack.Application.Common.Interfaces;
using TechTrack.Infrastructure.Network;
using TechTrack.Infrastructure.Persistence;
using TechTrack.Infrastructure.Persistence.Repositories;
using TechTrack.Infrastructure.Time;

namespace TechTrack.Infrastructure;

/// <summary>
/// Registro de servicios de infraestructura (persistencia, repositorios, servicios externos).
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<LocalSendOptions>(
            configuration.GetSection(LocalSendOptions.SectionName));
        services.Configure<PresenceIngestOptions>(
            configuration.GetSection(PresenceIngestOptions.SectionName));

        var useInMemory = configuration.GetValue("Database:UseInMemory", false);

        if (useInMemory)
        {
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("TechTrack"));
        }
        else
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new InvalidOperationException(
                    "Connection string 'DefaultConnection' was not found. " +
                    "Set Database:UseInMemory=true for local demos without SQL Server.");
            }

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(connectionString, sqlOptions =>
                    sqlOptions.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));
        }

        services.AddScoped<INetworkDeviceRepository, NetworkDeviceRepository>();
        services.AddSingleton<IDateTimeProvider, SystemDateTimeProvider>();
        services.AddHostedService<NetworkPresenceOfflineMonitor>();

        return services;
    }
}

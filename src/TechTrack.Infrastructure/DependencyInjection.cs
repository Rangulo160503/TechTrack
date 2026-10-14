using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TechTrack.Application.Common.Interfaces;
using TechTrack.Infrastructure.Mail;
using TechTrack.Infrastructure.Network;
using TechTrack.Infrastructure.Persistence;
using TechTrack.Infrastructure.Persistence.Repositories;
using TechTrack.Infrastructure.Security;
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
        services.Configure<AuthOptions>(
            configuration.GetSection(AuthOptions.SectionName));

        var provider = ResolveProvider(configuration);
        var migrationsAssembly = typeof(ApplicationDbContext).Assembly.FullName;

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            switch (provider)
            {
                case DatabaseProviderNames.InMemory:
                    options.UseInMemoryDatabase("TechTrack");
                    break;

                case DatabaseProviderNames.SqlServer:
                {
                    var connectionString = configuration.GetConnectionString("DefaultConnection");
                    if (string.IsNullOrWhiteSpace(connectionString))
                    {
                        throw new InvalidOperationException(
                            "Connection string 'DefaultConnection' is required when Database:Provider=SqlServer.");
                    }

                    options.UseSqlServer(
                        connectionString,
                        sql => sql.MigrationsAssembly(migrationsAssembly));
                    break;
                }

                default:
                {
                    // SQLite: un archivo local. Sin instalar SQL Server / Docker.
                    var connectionString = configuration.GetConnectionString("DefaultConnection");
                    if (string.IsNullOrWhiteSpace(connectionString))
                    {
                        connectionString = "Data Source=data/techtrack.db";
                    }

                    options.UseSqlite(
                        connectionString,
                        sqlite => sqlite.MigrationsAssembly(migrationsAssembly));
                    break;
                }
            }
        });

        services.AddScoped<INetworkDeviceRepository, NetworkDeviceRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IPasswordResetTokenRepository, PasswordResetTokenRepository>();
        services.AddScoped<IRoleLookup, RoleLookup>();
        services.AddScoped<AuthDataSeeder>();
        services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddSingleton<IEmailSender, SmtpEmailSender>();
        services.AddSingleton<IDateTimeProvider, SystemDateTimeProvider>();
        services.AddHostedService<NetworkPresenceOfflineMonitor>();

        return services;
    }

    public static string ResolveProvider(IConfiguration configuration)
    {
        var explicitProvider = configuration["Database:Provider"];
        if (!string.IsNullOrWhiteSpace(explicitProvider))
        {
            return explicitProvider.Trim();
        }

        if (configuration.GetValue("Database:UseInMemory", false))
        {
            return DatabaseProviderNames.InMemory;
        }

        return DatabaseProviderNames.Sqlite;
    }
}

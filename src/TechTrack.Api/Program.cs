using System.Net;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
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

    var authOptions = builder.Configuration.GetSection(AuthOptions.SectionName).Get<AuthOptions>()
        ?? new AuthOptions();
    if (string.IsNullOrWhiteSpace(authOptions.Jwt.SigningKey) || authOptions.Jwt.SigningKey.Length < 32)
    {
        throw new InvalidOperationException(
            "Configure Auth:Jwt:SigningKey with at least 32 characters (appsettings).");
    }

    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateIssuerSigningKey = true,
                ValidateLifetime = true,
                ValidIssuer = authOptions.Jwt.Issuer,
                ValidAudience = authOptions.Jwt.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(authOptions.Jwt.SigningKey)),
                ClockSkew = TimeSpan.FromMinutes(1),
                RoleClaimType = "role",
            };
        });

    builder.Services.AddAuthorization();

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

                    if (uri.Host is "localhost" or "127.0.0.1")
                    {
                        return true;
                    }

                    if (IPAddress.TryParse(uri.Host, out var ip))
                    {
                        return IsPrivateIp(ip);
                    }

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
        options.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "TechTrack API",
            Version = "v1",
            Description = "API para la gestión de activos tecnológicos del CTP Santa Eulalia."
        });

        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "JWT access token",
        });
        options.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("Bearer")] = []
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
    app.UseAuthentication();
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
    var provider = TechTrack.Infrastructure.DependencyInjection.ResolveProvider(configuration);

    if (provider == DatabaseProviderNames.InMemory)
    {
        await db.Database.EnsureCreatedAsync();
        await SeedAuthAsync(scope);
        return;
    }

    if (provider == DatabaseProviderNames.Sqlite)
    {
        var dataDir = Path.Combine(app.Environment.ContentRootPath, "data");
        Directory.CreateDirectory(dataDir);
        await EnsureSqliteSchemaAsync(db, dataDir);
        await SeedAuthAsync(scope);
        return;
    }

    if (app.Environment.IsDevelopment() || configuration.GetValue("Database:ApplyMigrationsOnStartup", false))
    {
        await db.Database.MigrateAsync();
        await SeedAuthAsync(scope);
    }
}

static async Task SeedAuthAsync(IServiceScope scope)
{
    var seeder = scope.ServiceProvider.GetRequiredService<AuthDataSeeder>();
    await seeder.SeedAsync();
}

/// <summary>
/// EnsureCreated no agrega tablas nuevas si ya existen otras.
/// Si faltan Users/Roles, recrea. Si solo falta PasswordResetTokens, la crea aditiva.
/// </summary>
static async Task EnsureSqliteSchemaAsync(ApplicationDbContext db, string dataDir)
{
    await db.Database.EnsureCreatedAsync();

    var hasUsers = await TableExistsAsync(db, "Users");
    var hasRoles = await TableExistsAsync(db, "Roles");
    var hasReset = await TableExistsAsync(db, "PasswordResetTokens");

    if (hasUsers && hasRoles && hasReset)
    {
        return;
    }

    if (hasUsers && hasRoles && !hasReset)
    {
        Log.Information("Adding PasswordResetTokens table to existing SQLite database.");
        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE TABLE IF NOT EXISTS "PasswordResetTokens" (
                "Id" TEXT NOT NULL CONSTRAINT "PK_PasswordResetTokens" PRIMARY KEY,
                "UserId" TEXT NOT NULL,
                "TokenHash" TEXT NOT NULL,
                "ExpiresAtUtc" TEXT NOT NULL,
                "CreatedAtUtc" TEXT NOT NULL,
                "UsedAtUtc" TEXT NULL,
                CONSTRAINT "FK_PasswordResetTokens_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
            );
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_PasswordResetTokens_TokenHash" ON "PasswordResetTokens" ("TokenHash");
            CREATE INDEX IF NOT EXISTS "IX_PasswordResetTokens_UserId_UsedAtUtc" ON "PasswordResetTokens" ("UserId", "UsedAtUtc");
            """);
        return;
    }

    Log.Warning(
        "SQLite schema incomplete (missing Users/Roles). Recreating database file under {DataDir}.",
        dataDir);
    try
    {
        await db.Database.EnsureDeletedAsync();
    }
    catch (IOException ex)
    {
        throw new InvalidOperationException(
            "Cannot recreate techtrack.db because another process has it open. Stop REFRESH/API and retry.",
            ex);
    }

    await db.Database.EnsureCreatedAsync();
}

static async Task<bool> TableExistsAsync(ApplicationDbContext db, string tableName)
{
    var connection = db.Database.GetDbConnection();
    if (connection.State != System.Data.ConnectionState.Open)
    {
        await connection.OpenAsync();
    }

    await using var command = connection.CreateCommand();
    // Literal table name (not user input) — avoid parameter quirks across providers.
    command.CommandText =
        $"SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = '{tableName}' LIMIT 1;";

    var result = await command.ExecuteScalarAsync();
    return result is not null && result is not DBNull;
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

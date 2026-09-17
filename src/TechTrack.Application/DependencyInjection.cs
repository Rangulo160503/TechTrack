using Microsoft.Extensions.DependencyInjection;
using TechTrack.Application.Features.NetworkPresence.Services;

namespace TechTrack.Application;

/// <summary>
/// Registro de servicios de la capa de aplicación (casos de uso, MediatR, validaciones).
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddMediatR(configuration =>
            configuration.RegisterServicesFromAssembly(AssemblyReference.Assembly));

        services.AddScoped<NetworkPresenceOfflineService>();

        return services;
    }
}

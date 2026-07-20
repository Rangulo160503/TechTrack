using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace TechTrack.Infrastructure.Persistence;

/// <summary>
/// Fábrica usada exclusivamente por las herramientas de EF Core (dotnet ef)
/// para generar migraciones sin necesidad de levantar la API.
/// </summary>
public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        // La cadena real solo se necesita al aplicar migraciones; para generarlas basta un valor válido.
        var connectionString = Environment.GetEnvironmentVariable("TECHTRACK_CONNECTION_STRING")
            ?? "Server=localhost,1433;Database=TechTrackDb;User Id=sa;Password=DesignTimeOnly1!;TrustServerCertificate=True;";

        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        optionsBuilder.UseSqlServer(connectionString);

        return new ApplicationDbContext(optionsBuilder.Options);
    }
}

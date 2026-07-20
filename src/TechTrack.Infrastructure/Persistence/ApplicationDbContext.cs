using Microsoft.EntityFrameworkCore;

namespace TechTrack.Infrastructure.Persistence;

/// <summary>
/// Contexto principal de EF Core. Las entidades y sus configuraciones
/// se agregarán en pasos posteriores mediante IEntityTypeConfiguration.
/// </summary>
public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}

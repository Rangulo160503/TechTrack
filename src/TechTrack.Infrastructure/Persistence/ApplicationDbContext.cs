using Microsoft.EntityFrameworkCore;
using TechTrack.Domain.Entities;

namespace TechTrack.Infrastructure.Persistence;

/// <summary>
/// Contexto principal de EF Core. Las entidades y sus configuraciones
/// se agregan mediante IEntityTypeConfiguration.
/// </summary>
public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<NetworkDevice> NetworkDevices => Set<NetworkDevice>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}

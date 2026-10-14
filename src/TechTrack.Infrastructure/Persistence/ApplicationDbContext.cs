using Microsoft.EntityFrameworkCore;
using TechTrack.Domain.Common;
using TechTrack.Domain.Entities;

namespace TechTrack.Infrastructure.Persistence;

/// <summary>
/// Contexto principal de EF Core. Las entidades y sus configuraciones
/// se agregan mediante IEntityTypeConfiguration.
/// </summary>
public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<NetworkDevice> NetworkDevices => Set<NetworkDevice>();

    public DbSet<User> Users => Set<User>();

    public DbSet<Role> Roles => Set<Role>();

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        StampAuditableEntities();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        StampAuditableEntities();
        return base.SaveChanges();
    }

    private void StampAuditableEntities()
    {
        var now = DateTime.UtcNow;
        const string by = "system";

        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.StampCreated(now, by);
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.StampUpdated(now, by);
            }
        }
    }
}

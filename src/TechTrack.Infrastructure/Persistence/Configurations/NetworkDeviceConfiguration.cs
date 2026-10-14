using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TechTrack.Domain.Entities;

namespace TechTrack.Infrastructure.Persistence.Configurations;

public sealed class NetworkDeviceConfiguration : IEntityTypeConfiguration<NetworkDevice>
{
    public void Configure(EntityTypeBuilder<NetworkDevice> builder)
    {
        builder.ToTable("NetworkDevices");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.IpAddress)
            .HasMaxLength(NetworkDevice.IpAddressMaxLength)
            .IsRequired();

        builder.Property(x => x.MacAddress)
            .HasMaxLength(NetworkDevice.MacAddressMaxLength);

        builder.Property(x => x.Hostname)
            .HasMaxLength(NetworkDevice.HostnameMaxLength);

        builder.Property(x => x.Vendor)
            .HasMaxLength(NetworkDevice.VendorMaxLength);

        builder.Property(x => x.OsVersion)
            .HasMaxLength(NetworkDevice.OsVersionMaxLength);

        builder.Property(x => x.HardwareProfileJson);

        builder.Property(x => x.LastSeenByAgentId)
            .HasMaxLength(NetworkDevice.AgentIdMaxLength)
            .IsRequired();

        builder.Property(x => x.FirstSeenAt).IsRequired();
        builder.Property(x => x.LastSeenAt).IsRequired();
        builder.Property(x => x.IsOnline).IsRequired();

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();
        builder.Property(x => x.CreatedBy)
            .HasMaxLength(256)
            .IsRequired();
        builder.Property(x => x.UpdatedBy)
            .HasMaxLength(256)
            .IsRequired();
        builder.Property(x => x.IsActive).IsRequired();

        // Único por MAC. Sin filtro SQL Server-only para compatibilidad con SQLite.
        builder.HasIndex(x => x.MacAddress).IsUnique();

        builder.HasIndex(x => x.IpAddress);
        builder.HasIndex(x => new { x.IsOnline, x.LastSeenAt });

        builder.Ignore(x => x.DomainEvents);
    }
}

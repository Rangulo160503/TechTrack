using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TechTrack.Domain.Entities;

namespace TechTrack.Infrastructure.Persistence.Configurations;

public sealed class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("Roles");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .HasMaxLength(Role.NameMaxLength)
            .IsRequired();

        builder.Property(x => x.Description)
            .HasMaxLength(Role.DescriptionMaxLength);

        builder.Property(x => x.Type).IsRequired();

        builder.HasIndex(x => x.Type).IsUnique();
        builder.HasIndex(x => x.Name).IsUnique();

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).HasMaxLength(256).IsRequired();
        builder.Property(x => x.UpdatedBy).HasMaxLength(256).IsRequired();
        builder.Property(x => x.IsActive).IsRequired();

        builder.Ignore(x => x.DomainEvents);
        builder.Ignore(x => x.Permissions);
    }
}

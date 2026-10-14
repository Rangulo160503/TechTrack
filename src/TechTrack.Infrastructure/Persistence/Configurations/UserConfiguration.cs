using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TechTrack.Domain.Entities;

namespace TechTrack.Infrastructure.Persistence.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Username)
            .HasMaxLength(User.UsernameMaxLength)
            .IsRequired();

        builder.HasIndex(x => x.Username).IsUnique();

        builder.OwnsOne(x => x.Email, email =>
        {
            email.Property(e => e.Value)
                .HasColumnName("Email")
                .HasMaxLength(256)
                .IsRequired();
            email.HasIndex(e => e.Value).IsUnique();
        });

        builder.OwnsOne(x => x.Name, name =>
        {
            name.Property(n => n.FirstName)
                .HasColumnName("FirstName")
                .HasMaxLength(100)
                .IsRequired();
            name.Property(n => n.LastName)
                .HasColumnName("LastName")
                .HasMaxLength(100)
                .IsRequired();
            name.Ignore(n => n.FullName);
        });

        builder.Property(x => x.PasswordHash)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(x => x.Status).IsRequired();
        builder.Property(x => x.RoleId).IsRequired();

        builder.HasOne(x => x.Role)
            .WithMany()
            .HasForeignKey(x => x.RoleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).HasMaxLength(256).IsRequired();
        builder.Property(x => x.UpdatedBy).HasMaxLength(256).IsRequired();
        builder.Property(x => x.IsActive).IsRequired();

        builder.Ignore(x => x.DomainEvents);
    }
}

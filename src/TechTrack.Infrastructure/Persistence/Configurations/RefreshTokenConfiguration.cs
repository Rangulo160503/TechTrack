using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TechTrack.Domain.Entities;

namespace TechTrack.Infrastructure.Persistence.Configurations;

public sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("RefreshTokens");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.UserId).IsRequired();

        builder.Property(x => x.TokenHash)
            .HasMaxLength(RefreshToken.TokenHashMaxLength)
            .IsRequired();

        builder.HasIndex(x => x.TokenHash).IsUnique();
        builder.HasIndex(x => new { x.UserId, x.RevokedAtUtc });

        builder.Property(x => x.ExpiresAtUtc).IsRequired();
        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.Property(x => x.RevokedAtUtc);
        builder.Property(x => x.ReplacedByTokenHash)
            .HasMaxLength(RefreshToken.TokenHashMaxLength);
        builder.Property(x => x.CreatedByIp)
            .HasMaxLength(RefreshToken.IpMaxLength);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

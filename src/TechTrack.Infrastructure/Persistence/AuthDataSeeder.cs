using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TechTrack.Application.Common.Interfaces;
using TechTrack.Domain.Entities;
using TechTrack.Domain.Enums;
using TechTrack.Domain.ValueObjects;

namespace TechTrack.Infrastructure.Persistence;

public sealed class AuthDataSeeder(
    ApplicationDbContext db,
    IPasswordHasher passwordHasher,
    IOptions<AuthOptions> authOptions,
    ILogger<AuthDataSeeder> logger)
{
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await EnsureRolesAsync(cancellationToken);
        await EnsureAdminAsync(cancellationToken);
    }

    private async Task EnsureRolesAsync(CancellationToken cancellationToken)
    {
        if (await db.Roles.AnyAsync(cancellationToken))
        {
            return;
        }

        db.Roles.AddRange(
            new Role("Administrator", RoleType.Administrator, "Acceso total al sistema"),
            new Role("Technician", RoleType.Technician, "Operación técnica e inventario"),
            new Role("Viewer", RoleType.Viewer, "Solo consulta"),
            new Role("Auditor", RoleType.Auditor, "Consulta y reportes de auditoría"));

        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Seeded RBAC roles");
    }

    private async Task EnsureAdminAsync(CancellationToken cancellationToken)
    {
        var seed = authOptions.Value.Seed;
        var username = (seed.AdminUsername ?? "admin").Trim().ToLowerInvariant();
        var desiredEmail = new Email(
            string.IsNullOrWhiteSpace(seed.AdminEmail)
                ? "joelangulo750@outlook.com"
                : seed.AdminEmail);

        var existing = await db.Users.FirstOrDefaultAsync(u => u.Username == username, cancellationToken);
        if (existing is not null)
        {
            if (!string.Equals(existing.Email.Value, desiredEmail.Value, StringComparison.Ordinal))
            {
                existing.ChangeEmail(desiredEmail);
                await db.SaveChangesAsync(cancellationToken);
                logger.LogInformation(
                    "Updated admin '{Username}' email to {Email}",
                    username,
                    desiredEmail.Value);
            }

            return;
        }

        var adminRole = await db.Roles.FirstAsync(
            r => r.Type == RoleType.Administrator,
            cancellationToken);

        var password = string.IsNullOrWhiteSpace(seed.AdminPassword)
            ? "Admin123!"
            : seed.AdminPassword;

        var user = new User(
            username,
            desiredEmail,
            new PersonName(seed.AdminFirstName, seed.AdminLastName),
            passwordHasher.Hash(password),
            adminRole.Id);

        await db.Users.AddAsync(user, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Seeded admin user '{Username}' ({Email})", username, desiredEmail.Value);
    }
}

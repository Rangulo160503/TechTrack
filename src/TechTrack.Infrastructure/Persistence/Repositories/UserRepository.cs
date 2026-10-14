using Microsoft.EntityFrameworkCore;
using TechTrack.Application.Common.Interfaces;
using TechTrack.Domain.Entities;

namespace TechTrack.Infrastructure.Persistence.Repositories;

public sealed class UserRepository(ApplicationDbContext dbContext) : IUserRepository
{
    public Task<User?> FindByUsernameAsync(
        string username,
        CancellationToken cancellationToken = default)
    {
        var normalized = username.Trim().ToLowerInvariant();
        return dbContext.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Username == normalized, cancellationToken);
    }

    public Task<User?> FindByEmailAsync(
        string email,
        CancellationToken cancellationToken = default)
    {
        var normalized = email.Trim().ToLowerInvariant();
        return dbContext.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email.Value == normalized, cancellationToken);
    }

    public Task<User?> FindByUsernameOrEmailAsync(
        string login,
        CancellationToken cancellationToken = default)
    {
        var normalized = login.Trim().ToLowerInvariant();
        if (normalized.Contains('@'))
        {
            return FindByEmailAsync(normalized, cancellationToken);
        }

        return FindByUsernameAsync(normalized, cancellationToken);
    }

    public Task<User?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        dbContext.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

    public Task<bool> UsernameExistsAsync(
        string username,
        CancellationToken cancellationToken = default)
    {
        var normalized = username.Trim().ToLowerInvariant();
        return dbContext.Users.AnyAsync(u => u.Username == normalized, cancellationToken);
    }

    public async Task AddAsync(User user, CancellationToken cancellationToken = default) =>
        await dbContext.Users.AddAsync(user, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        dbContext.SaveChangesAsync(cancellationToken);
}

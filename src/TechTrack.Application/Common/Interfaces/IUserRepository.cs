using TechTrack.Domain.Entities;

namespace TechTrack.Application.Common.Interfaces;

public interface IUserRepository
{
    Task<User?> FindByUsernameAsync(string username, CancellationToken cancellationToken = default);

    Task<User?> FindByEmailAsync(string email, CancellationToken cancellationToken = default);

    /// <summary>Resuelve por usuario o por correo (si el valor contiene @).</summary>
    Task<User?> FindByUsernameOrEmailAsync(string login, CancellationToken cancellationToken = default);

    Task<User?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> UsernameExistsAsync(string username, CancellationToken cancellationToken = default);

    Task AddAsync(User user, CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

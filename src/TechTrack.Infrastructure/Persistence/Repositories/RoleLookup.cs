using Microsoft.EntityFrameworkCore;
using TechTrack.Application.Common.Interfaces;
using TechTrack.Domain.Entities;
using TechTrack.Domain.Enums;

namespace TechTrack.Infrastructure.Persistence.Repositories;

public sealed class RoleLookup(ApplicationDbContext dbContext) : IRoleLookup
{
    public Task<Role?> GetByTypeAsync(RoleType type, CancellationToken cancellationToken = default) =>
        dbContext.Roles.FirstOrDefaultAsync(r => r.Type == type && r.IsActive, cancellationToken);
}

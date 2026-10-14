using TechTrack.Domain.Entities;
using TechTrack.Domain.Enums;

namespace TechTrack.Application.Common.Interfaces;

public interface IRoleLookup
{
    Task<Role?> GetByTypeAsync(RoleType type, CancellationToken cancellationToken = default);
}

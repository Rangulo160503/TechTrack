using TechTrack.Domain.Entities;

namespace TechTrack.Application.Features.Auth.Dtos;

public static class AuthMappings
{
    public static AuthUserDto ToDto(this User user) =>
        new(
            user.Id,
            user.Username,
            user.Email.Value,
            user.Name.FirstName,
            user.Name.LastName,
            user.Name.FullName,
            user.Role?.Type.ToString() ?? user.Role?.Name ?? "Unknown",
            user.Status.ToString());
}

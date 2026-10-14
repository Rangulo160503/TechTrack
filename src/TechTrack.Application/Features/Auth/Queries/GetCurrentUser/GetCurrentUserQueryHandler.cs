using MediatR;
using TechTrack.Application.Common.Interfaces;
using TechTrack.Application.Features.Auth.Dtos;
using TechTrack.Domain.Enums;

namespace TechTrack.Application.Features.Auth.Queries.GetCurrentUser;

public sealed class GetCurrentUserQueryHandler(IUserRepository users)
    : IRequestHandler<GetCurrentUserQuery, AuthUserDto?>
{
    public async Task<AuthUserDto?> Handle(
        GetCurrentUserQuery request,
        CancellationToken cancellationToken)
    {
        var user = await users.FindByIdAsync(request.UserId, cancellationToken);
        if (user is null || user.Status != UserStatus.Active || !user.IsActive)
        {
            return null;
        }

        return user.ToDto();
    }
}

using MediatR;
using TechTrack.Application.Features.Auth.Dtos;

namespace TechTrack.Application.Features.Auth.Commands.Logout;

public sealed record LogoutCommand(LogoutRequestDto Request, Guid? UserId) : IRequest<bool>;

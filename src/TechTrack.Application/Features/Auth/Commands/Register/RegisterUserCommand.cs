using MediatR;
using TechTrack.Application.Features.Auth.Dtos;

namespace TechTrack.Application.Features.Auth.Commands.Register;

public sealed record RegisterUserCommand(RegisterUserRequestDto Request)
    : IRequest<RegisterUserResult>;

public sealed record RegisterUserResult(bool Succeeded, string? Error, AuthUserDto? User);

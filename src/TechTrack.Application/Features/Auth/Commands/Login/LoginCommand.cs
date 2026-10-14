using MediatR;
using TechTrack.Application.Features.Auth.Dtos;

namespace TechTrack.Application.Features.Auth.Commands.Login;

public sealed record LoginCommand(LoginRequestDto Request, string? ClientIp)
    : IRequest<AuthResponseDto?>;

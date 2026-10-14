using MediatR;
using TechTrack.Application.Features.Auth.Dtos;

namespace TechTrack.Application.Features.Auth.Commands.Refresh;

public sealed record RefreshTokenCommand(RefreshRequestDto Request, string? ClientIp)
    : IRequest<AuthResponseDto?>;

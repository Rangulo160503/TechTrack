using MediatR;
using TechTrack.Application.Features.Auth.Dtos;

namespace TechTrack.Application.Features.Auth.Commands.ResetPassword;

public sealed record ResetPasswordCommand(ResetPasswordRequestDto Request)
    : IRequest<ResetPasswordResult>;

public sealed record ResetPasswordResult(bool Succeeded, string? Error);

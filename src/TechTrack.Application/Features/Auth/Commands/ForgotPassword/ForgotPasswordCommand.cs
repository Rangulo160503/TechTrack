using MediatR;
using TechTrack.Application.Features.Auth.Dtos;

namespace TechTrack.Application.Features.Auth.Commands.ForgotPassword;

public sealed record ForgotPasswordCommand(ForgotPasswordRequestDto Request)
    : IRequest<ForgotPasswordResult>;

public sealed record ForgotPasswordResult(bool Accepted, string Message);

using TechTrack.Domain.Entities;

namespace TechTrack.Application.Common.Interfaces;

public sealed record AccessTokenResult(string Token, DateTime ExpiresAtUtc);

public interface IJwtTokenService
{
    AccessTokenResult CreateAccessToken(User user);

    string CreateRefreshToken();

    string HashRefreshToken(string refreshToken);
}

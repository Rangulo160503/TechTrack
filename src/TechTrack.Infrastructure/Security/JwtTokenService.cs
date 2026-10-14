using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using TechTrack.Application.Common.Interfaces;
using TechTrack.Domain.Entities;

namespace TechTrack.Infrastructure.Security;

public sealed class JwtTokenService(
    IOptions<AuthOptions> options,
    IDateTimeProvider clock) : IJwtTokenService
{
    public AccessTokenResult CreateAccessToken(User user)
    {
        var jwt = options.Value.Jwt;
        if (string.IsNullOrWhiteSpace(jwt.SigningKey) || jwt.SigningKey.Length < 32)
        {
            throw new InvalidOperationException(
                "Auth:Jwt:SigningKey must be configured with at least 32 characters.");
        }

        var now = clock.UtcNow;
        var minutes = Math.Clamp(jwt.AccessTokenMinutes, 5, 240);
        var expires = now.AddMinutes(minutes);
        var roleName = user.Role?.Type.ToString() ?? user.Role?.Name ?? "Viewer";

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, user.Username),
            new(JwtRegisteredClaimNames.Email, user.Email.Value),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Role, roleName),
            new("role", roleName),
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: jwt.Issuer,
            audience: jwt.Audience,
            claims: claims,
            notBefore: now,
            expires: expires,
            signingCredentials: credentials);

        var encoded = new JwtSecurityTokenHandler().WriteToken(token);
        return new AccessTokenResult(encoded, expires);
    }

    public string CreateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    public string HashRefreshToken(string refreshToken)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken));
        return Convert.ToHexString(hash);
    }
}

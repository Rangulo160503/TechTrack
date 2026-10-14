namespace TechTrack.Application.Features.Auth.Dtos;

/// <summary>
/// Username = usuario o correo. Email opcional si el cliente lo envía aparte.
/// </summary>
public sealed record LoginRequestDto(string? Username, string Password, string? Email = null);

public sealed record RegisterUserRequestDto(
    string Username,
    string Password,
    string Email,
    string FirstName,
    string LastName,
    string Role);

public sealed record ForgotPasswordRequestDto(string Email);

public sealed record ResetPasswordRequestDto(string Token, string NewPassword);

public sealed record RefreshRequestDto(string RefreshToken);

public sealed record LogoutRequestDto(string? RefreshToken);

public sealed record AuthTokensDto(
    string AccessToken,
    DateTime AccessTokenExpiresAtUtc,
    string RefreshToken,
    DateTime RefreshTokenExpiresAtUtc);

public sealed record AuthUserDto(
    Guid Id,
    string Username,
    string Email,
    string FirstName,
    string LastName,
    string FullName,
    string Role,
    string Status);

public sealed record AuthResponseDto(AuthUserDto User, AuthTokensDto Tokens);

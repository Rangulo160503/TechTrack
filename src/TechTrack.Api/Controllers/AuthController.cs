using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechTrack.Application.Features.Auth.Commands.ForgotPassword;
using TechTrack.Application.Features.Auth.Commands.Login;
using TechTrack.Application.Features.Auth.Commands.Logout;
using TechTrack.Application.Features.Auth.Commands.Refresh;
using TechTrack.Application.Features.Auth.Commands.Register;
using TechTrack.Application.Features.Auth.Commands.ResetPassword;
using TechTrack.Application.Features.Auth.Dtos;
using TechTrack.Application.Features.Auth.Queries.GetCurrentUser;

namespace TechTrack.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IMediator mediator) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> Login(
        [FromBody] LoginRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(
            new LoginCommand(request, ClientIp()),
            cancellationToken);

        if (result is null)
        {
            return Unauthorized(new { error = "Usuario/correo o contraseña incorrectos." });
        }

        return Ok(result);
    }

    [AllowAnonymous]
    [HttpPost("forgot-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new ForgotPasswordCommand(request), cancellationToken);
        if (!result.Accepted)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { error = result.Message });
        }

        return Ok(new { message = result.Message });
    }

    [AllowAnonymous]
    [HttpPost("reset-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword(
        [FromBody] ResetPasswordRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new ResetPasswordCommand(request), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error ?? "No se pudo restablecer la contraseña." });
        }

        return Ok(new { message = "Contraseña actualizada. Ya podés iniciar sesión." });
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> Refresh(
        [FromBody] RefreshRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(
            new RefreshTokenCommand(request, ClientIp()),
            cancellationToken);

        if (result is null)
        {
            return Unauthorized(new { error = "Sesión inválida o expirada." });
        }

        return Ok(result);
    }

    [Authorize]
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(
        [FromBody] LogoutRequestDto? request,
        CancellationToken cancellationToken)
    {
        await mediator.Send(
            new LogoutCommand(request ?? new LogoutRequestDto(null), CurrentUserId()),
            cancellationToken);
        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(AuthUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthUserDto>> Me(CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var user = await mediator.Send(new GetCurrentUserQuery(userId.Value), cancellationToken);
        return user is null ? Unauthorized() : Ok(user);
    }

    /// <summary>Crea un usuario. Solo Administrador.</summary>
    [Authorize(Roles = "Administrator")]
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthUserDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AuthUserDto>> Register(
        [FromBody] RegisterUserRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new RegisterUserCommand(request), cancellationToken);
        if (!result.Succeeded || result.User is null)
        {
            return BadRequest(new { error = result.Error ?? "No se pudo crear el usuario." });
        }

        return CreatedAtAction(nameof(Me), result.User);
    }

    private Guid? CurrentUserId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(ClaimTypes.Name)
            ?? User.FindFirstValue("sub");

        return Guid.TryParse(raw, out var id) ? id : null;
    }

    private string? ClientIp() =>
        HttpContext.Connection.RemoteIpAddress?.ToString();
}

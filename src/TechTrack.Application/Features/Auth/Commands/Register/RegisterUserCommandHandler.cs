using MediatR;
using TechTrack.Application.Common.Interfaces;
using TechTrack.Application.Features.Auth.Dtos;
using TechTrack.Domain.Entities;
using TechTrack.Domain.Enums;
using TechTrack.Domain.ValueObjects;

namespace TechTrack.Application.Features.Auth.Commands.Register;

public sealed class RegisterUserCommandHandler(
    IUserRepository users,
    IRoleLookup roles,
    IPasswordHasher passwordHasher) : IRequestHandler<RegisterUserCommand, RegisterUserResult>
{
    public async Task<RegisterUserResult> Handle(
        RegisterUserCommand command,
        CancellationToken cancellationToken)
    {
        var req = command.Request;
        var username = req.Username?.Trim() ?? string.Empty;
        var password = req.Password ?? string.Empty;

        if (username.Length < User.UsernameMinLength || password.Length < 8)
        {
            return new RegisterUserResult(false, "Usuario o contraseña inválidos (mín. 8 caracteres).", null);
        }

        if (await users.UsernameExistsAsync(username, cancellationToken))
        {
            return new RegisterUserResult(false, "Ese nombre de usuario ya existe.", null);
        }

        if (!TryParseRole(req.Role, out var roleType))
        {
            return new RegisterUserResult(
                false,
                "Rol inválido. Use Administrator, Technician, Viewer o Auditor.",
                null);
        }

        var role = await roles.GetByTypeAsync(roleType, cancellationToken);
        if (role is null)
        {
            return new RegisterUserResult(false, "El rol solicitado no está configurado.", null);
        }

        try
        {
            var email = new Email(req.Email);
            var name = new PersonName(req.FirstName, req.LastName);
            var user = new User(username, email, name, passwordHasher.Hash(password), role.Id);

            await users.AddAsync(user, cancellationToken);
            await users.SaveChangesAsync(cancellationToken);

            var saved = await users.FindByIdAsync(user.Id, cancellationToken);
            return new RegisterUserResult(true, null, saved!.ToDto());
        }
        catch (ArgumentException ex)
        {
            return new RegisterUserResult(false, ex.Message, null);
        }
    }

    private static bool TryParseRole(string? role, out RoleType type)
    {
        type = RoleType.Viewer;
        if (string.IsNullOrWhiteSpace(role))
        {
            return true;
        }

        return Enum.TryParse(role.Trim(), ignoreCase: true, out type) && Enum.IsDefined(type);
    }
}

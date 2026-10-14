namespace TechTrack.Application.Common.Interfaces;

public sealed class AuthOptions
{
    public const string SectionName = "Auth";

    public JwtOptions Jwt { get; set; } = new();

    public SeedAdminOptions Seed { get; set; } = new();

    public EmailOptions Email { get; set; } = new();
}

public sealed class JwtOptions
{
    public string Issuer { get; set; } = "TechTrack";

    public string Audience { get; set; } = "TechTrack";

    public string SigningKey { get; set; } = string.Empty;

    public int AccessTokenMinutes { get; set; } = 30;

    public int RefreshTokenDays { get; set; } = 14;
}

public sealed class SeedAdminOptions
{
    public string AdminUsername { get; set; } = "admin";

    public string AdminPassword { get; set; } = "Admin123!";

    public string AdminEmail { get; set; } = "joelangulo750@outlook.com";

    public string AdminFirstName { get; set; } = "Admin";

    public string AdminLastName { get; set; } = "TechTrack";
}

/// <summary>SMTP externo (Gmail, Outlook, proveedor institucional, etc.).</summary>
public sealed class EmailOptions
{
    public bool Enabled { get; set; }

    public string Host { get; set; } = string.Empty;

    public int Port { get; set; } = 587;

    public bool UseStartTls { get; set; } = true;

    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string FromAddress { get; set; } = string.Empty;

    public string FromName { get; set; } = "TechTrack";

    /// <summary>URL pública del frontend para armar el link de restablecer (ej. tunnel o LAN).</summary>
    public string PublicAppBaseUrl { get; set; } = "http://127.0.0.1:5173";

    public int ResetTokenHours { get; set; } = 2;
}

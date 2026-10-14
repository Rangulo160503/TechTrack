namespace TechTrack.Infrastructure.Persistence;

/// <summary>
/// Proveedor de persistencia. Por defecto SQLite (un archivo .db, sin instalar SQL Server).
/// </summary>
public static class DatabaseProviderNames
{
    public const string Sqlite = "Sqlite";
    public const string SqlServer = "SqlServer";
    public const string InMemory = "InMemory";
}

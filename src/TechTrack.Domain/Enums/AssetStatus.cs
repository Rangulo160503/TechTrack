namespace TechTrack.Domain.Enums;

/// <summary>
/// Estado operativo de un activo. Valores explícitos para estabilidad en base de datos.
/// </summary>
public enum AssetStatus
{
    Operational = 1,
    InMaintenance = 2,
    OutOfService = 3,
    InStorage = 4,
    Decommissioned = 5
}

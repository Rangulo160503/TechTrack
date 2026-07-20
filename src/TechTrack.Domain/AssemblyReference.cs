using System.Reflection;

namespace TechTrack.Domain;

/// <summary>
/// Marcador del ensamblado Domain. Facilita el registro por reflexión
/// y las pruebas de arquitectura sin acoplarse a tipos concretos.
/// </summary>
public static class AssemblyReference
{
    public static Assembly Assembly { get; } = typeof(AssemblyReference).Assembly;
}

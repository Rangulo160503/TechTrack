using System.Reflection;

namespace TechTrack.Application;

/// <summary>
/// Marcador del ensamblado Application.
/// </summary>
public static class AssemblyReference
{
    public static Assembly Assembly { get; } = typeof(AssemblyReference).Assembly;
}

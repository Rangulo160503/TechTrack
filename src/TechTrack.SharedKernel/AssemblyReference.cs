using System.Reflection;

namespace TechTrack.SharedKernel;

/// <summary>
/// Marcador del ensamblado SharedKernel.
/// </summary>
public static class AssemblyReference
{
    public static Assembly Assembly { get; } = typeof(AssemblyReference).Assembly;
}

using FluentAssertions;

namespace TechTrack.UnitTests.Architecture;

/// <summary>
/// Pruebas que garantizan que las dependencias entre capas respetan Clean Architecture.
/// </summary>
public class ArchitectureTests
{
    private const string SolutionPrefix = "TechTrack.";

    [Fact]
    public void Domain_ShouldNotDependOnAnyOtherProject()
    {
        var references = Domain.AssemblyReference.Assembly
            .GetReferencedAssemblies()
            .Select(assembly => assembly.Name);

        references.Should().NotContain(name => name!.StartsWith(SolutionPrefix));
    }

    [Fact]
    public void SharedKernel_ShouldNotDependOnAnyOtherProject()
    {
        var references = SharedKernel.AssemblyReference.Assembly
            .GetReferencedAssemblies()
            .Select(assembly => assembly.Name);

        references.Should().NotContain(name => name!.StartsWith(SolutionPrefix));
    }

    [Fact]
    public void Application_ShouldOnlyDependOnDomainAndSharedKernel()
    {
        var allowedReferences = new[]
        {
            "TechTrack.Domain",
            "TechTrack.SharedKernel"
        };

        var solutionReferences = Application.AssemblyReference.Assembly
            .GetReferencedAssemblies()
            .Select(assembly => assembly.Name)
            .Where(name => name!.StartsWith(SolutionPrefix));

        solutionReferences.Should().BeSubsetOf(allowedReferences);
    }
}

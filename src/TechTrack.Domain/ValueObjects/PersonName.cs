using TechTrack.Domain.Common;

namespace TechTrack.Domain.ValueObjects;

/// <summary>
/// Nombre de una persona (nombre y apellidos) con validación de longitud.
/// </summary>
public sealed class PersonName : ValueObject
{
    public const int MaxPartLength = 100;

    public string FirstName { get; }

    public string LastName { get; }

    public string FullName => $"{FirstName} {LastName}";

    public PersonName(string firstName, string lastName)
    {
        FirstName = Guard.AgainstNullOrWhiteSpace(firstName, MaxPartLength, nameof(firstName));
        LastName = Guard.AgainstNullOrWhiteSpace(lastName, MaxPartLength, nameof(lastName));
    }

    public override string ToString() => FullName;

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return FirstName;
        yield return LastName;
    }
}

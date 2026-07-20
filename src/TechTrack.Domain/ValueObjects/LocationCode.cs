using System.Text.RegularExpressions;
using TechTrack.Domain.Common;

namespace TechTrack.Domain.ValueObjects;

/// <summary>
/// Código corto de ubicación física. Ej: LAB-01, AULA-12, DIR.
/// </summary>
public sealed partial class LocationCode : ValueObject
{
    public const int MinLength = 2;
    public const int MaxLength = 20;

    public string Value { get; }

    public LocationCode(string value)
    {
        var normalized = Guard.AgainstNullOrWhiteSpace(value, MaxLength, nameof(value))
            .ToUpperInvariant();

        if (normalized.Length < MinLength || !CodeRegex().IsMatch(normalized))
        {
            throw new ArgumentException(
                $"'{value}' is not a valid location code. Expected {MinLength}-{MaxLength} uppercase " +
                "alphanumeric characters, optionally separated by hyphens.",
                nameof(value));
        }

        Value = normalized;
    }

    public override string ToString() => Value;

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Value;
    }

    [GeneratedRegex(@"^[A-Z0-9]+(?:-[A-Z0-9]+)*$")]
    private static partial Regex CodeRegex();
}

using System.Text.RegularExpressions;
using TechTrack.Domain.Common;

namespace TechTrack.Domain.ValueObjects;

/// <summary>
/// Número de serie del fabricante, normalizado a mayúsculas.
/// Admite letras, dígitos y separadores comunes (guion, punto, barra, espacio).
/// </summary>
public sealed partial class SerialNumber : ValueObject
{
    public const int MaxLength = 100;

    public string Value { get; }

    public SerialNumber(string value)
    {
        var normalized = Guard.AgainstNullOrWhiteSpace(value, MaxLength, nameof(value))
            .ToUpperInvariant();

        if (!SerialRegex().IsMatch(normalized))
        {
            throw new ArgumentException($"'{value}' is not a valid serial number.", nameof(value));
        }

        Value = normalized;
    }

    public override string ToString() => Value;

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Value;
    }

    [GeneratedRegex(@"^(?=.*[A-Z0-9])[A-Z0-9\-\./ ]+$")]
    private static partial Regex SerialRegex();
}

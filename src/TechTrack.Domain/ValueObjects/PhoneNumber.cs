using System.Text.RegularExpressions;
using TechTrack.Domain.Common;

namespace TechTrack.Domain.ValueObjects;

/// <summary>
/// Número telefónico normalizado: se eliminan espacios y separadores;
/// admite prefijo internacional con "+" y entre 8 y 15 dígitos.
/// </summary>
public sealed partial class PhoneNumber : ValueObject
{
    public string Value { get; }

    public PhoneNumber(string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);

        var normalized = SeparatorsRegex().Replace(value.Trim(), string.Empty);

        if (!PhoneRegex().IsMatch(normalized))
        {
            throw new ArgumentException($"'{value}' is not a valid phone number.", nameof(value));
        }

        Value = normalized;
    }

    public override string ToString() => Value;

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Value;
    }

    [GeneratedRegex(@"[\s\-\(\)\.]")]
    private static partial Regex SeparatorsRegex();

    [GeneratedRegex(@"^\+?[0-9]{8,15}$")]
    private static partial Regex PhoneRegex();
}

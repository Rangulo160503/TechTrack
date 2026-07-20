using System.Text.RegularExpressions;
using TechTrack.Domain.Common;

namespace TechTrack.Domain.ValueObjects;

/// <summary>
/// Código institucional del activo (placa/etiqueta de inventario).
/// Alfanumérico en mayúsculas con segmentos separados por guiones. Ej: CTP-LAB1-0042.
/// </summary>
public sealed partial class AssetCode : ValueObject
{
    public const int MinLength = 3;
    public const int MaxLength = 30;

    public string Value { get; }

    public AssetCode(string value)
    {
        var normalized = Guard.AgainstNullOrWhiteSpace(value, MaxLength, nameof(value))
            .ToUpperInvariant();

        if (normalized.Length < MinLength || !CodeRegex().IsMatch(normalized))
        {
            throw new ArgumentException(
                $"'{value}' is not a valid asset code. Expected {MinLength}-{MaxLength} uppercase " +
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

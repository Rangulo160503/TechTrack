using System.Text.RegularExpressions;
using TechTrack.Domain.Common;

namespace TechTrack.Domain.ValueObjects;

/// <summary>
/// Dirección de correo electrónico validada y normalizada a minúsculas.
/// </summary>
public sealed partial class Email : ValueObject
{
    public const int MaxLength = 256;

    public string Value { get; }

    public Email(string value)
    {
        var normalized = Guard.AgainstNullOrWhiteSpace(value, MaxLength, nameof(value))
            .ToLowerInvariant();

        if (!EmailRegex().IsMatch(normalized))
        {
            throw new ArgumentException($"'{value}' is not a valid email address.", nameof(value));
        }

        Value = normalized;
    }

    public override string ToString() => Value;

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Value;
    }

    [GeneratedRegex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$")]
    private static partial Regex EmailRegex();
}

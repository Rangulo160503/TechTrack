namespace TechTrack.Domain.Common;

/// <summary>
/// Validaciones de entrada reutilizables (DRY) para constructores y métodos del dominio.
/// </summary>
internal static class Guard
{
    internal static string AgainstNullOrWhiteSpace(string? value, int maxLength, string paramName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException($"'{paramName}' cannot be null or whitespace.", paramName);
        }

        var trimmed = value.Trim();
        if (trimmed.Length > maxLength)
        {
            throw new ArgumentException(
                $"'{paramName}' cannot exceed {maxLength} characters.", paramName);
        }

        return trimmed;
    }

    internal static string? AgainstTooLongOptional(string? value, int maxLength, string paramName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var trimmed = value.Trim();
        if (trimmed.Length > maxLength)
        {
            throw new ArgumentException(
                $"'{paramName}' cannot exceed {maxLength} characters.", paramName);
        }

        return trimmed;
    }

    internal static Guid AgainstEmptyGuid(Guid value, string paramName)
    {
        if (value == Guid.Empty)
        {
            throw new ArgumentException($"'{paramName}' cannot be an empty Guid.", paramName);
        }

        return value;
    }
}

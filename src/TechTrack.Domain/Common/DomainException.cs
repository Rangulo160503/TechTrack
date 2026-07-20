namespace TechTrack.Domain.Common;

/// <summary>
/// Violación de una regla de negocio del dominio.
/// Los errores de entrada usan ArgumentException; los de negocio, esta excepción.
/// </summary>
public class DomainException : Exception
{
    public DomainException(string message)
        : base(message)
    {
    }

    public DomainException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}

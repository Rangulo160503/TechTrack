namespace TechTrack.Domain.Common;

/// <summary>
/// Contrato de todo evento de dominio. No depende de librerías externas:
/// la capa Application se encargará de adaptarlos al mecanismo de publicación.
/// </summary>
public interface IDomainEvent
{
    Guid EventId { get; }

    DateTime OccurredOnUtc { get; }
}

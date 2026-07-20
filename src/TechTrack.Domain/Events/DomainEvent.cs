using TechTrack.Domain.Common;

namespace TechTrack.Domain.Events;

/// <summary>
/// Base de los eventos de dominio concretos. Los records garantizan
/// inmutabilidad e igualdad estructural.
/// </summary>
public abstract record DomainEvent : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();

    public DateTime OccurredOnUtc { get; } = DateTime.UtcNow;
}

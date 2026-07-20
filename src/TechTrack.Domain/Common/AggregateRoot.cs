using TechTrack.Domain.Interfaces;

namespace TechTrack.Domain.Common;

/// <summary>
/// Raíz de agregado: única entrada al agregado y origen de los eventos de dominio.
/// </summary>
public abstract class AggregateRoot : AuditableEntity, IAggregateRoot
{
    private readonly List<IDomainEvent> _domainEvents = [];

    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    protected AggregateRoot()
    {
    }

    protected AggregateRoot(Guid id)
        : base(id)
    {
    }

    protected void AddDomainEvent(IDomainEvent domainEvent)
    {
        ArgumentNullException.ThrowIfNull(domainEvent);
        _domainEvents.Add(domainEvent);
    }

    public void RemoveDomainEvent(IDomainEvent domainEvent)
    {
        ArgumentNullException.ThrowIfNull(domainEvent);
        _domainEvents.Remove(domainEvent);
    }

    public void ClearDomainEvents() => _domainEvents.Clear();
}

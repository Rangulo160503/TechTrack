namespace TechTrack.Domain.Common;

/// <summary>
/// Entidad con datos de auditoría. Los campos CreatedAt/UpdatedAt/CreatedBy/UpdatedBy
/// los completa la infraestructura (interceptor de EF Core) al guardar cambios.
/// IsActive implementa borrado lógico (soft delete).
/// </summary>
public abstract class AuditableEntity : Entity
{
    public DateTime CreatedAt { get; private set; }

    public DateTime UpdatedAt { get; private set; }

    public string CreatedBy { get; private set; } = string.Empty;

    public string UpdatedBy { get; private set; } = string.Empty;

    public bool IsActive { get; private set; } = true;

    protected AuditableEntity()
    {
    }

    protected AuditableEntity(Guid id)
        : base(id)
    {
    }

    public void Activate() => IsActive = true;

    public void Deactivate() => IsActive = false;

    /// <summary>Usado por infraestructura al insertar la entidad.</summary>
    public void StampCreated(DateTime utcNow, string by)
    {
        CreatedAt = utcNow;
        UpdatedAt = utcNow;
        CreatedBy = by ?? string.Empty;
        UpdatedBy = by ?? string.Empty;
    }

    /// <summary>Usado por infraestructura al actualizar la entidad.</summary>
    public void StampUpdated(DateTime utcNow, string by)
    {
        UpdatedAt = utcNow;
        UpdatedBy = by ?? string.Empty;
    }
}

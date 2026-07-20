namespace TechTrack.Domain.Common;

/// <summary>
/// Base de toda entidad del dominio. La identidad se define por el Id,
/// nunca por sus atributos.
/// </summary>
public abstract class Entity : IEquatable<Entity>
{
    public Guid Id { get; protected set; }

    protected Entity()
    {
    }

    protected Entity(Guid id)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException("Entity id cannot be empty.", nameof(id));
        }

        Id = id;
    }

    public bool Equals(Entity? other)
    {
        if (other is null || other.GetType() != GetType())
        {
            return false;
        }

        // Entidades transitorias (sin Id asignado) nunca son iguales entre sí.
        return Id != Guid.Empty && Id == other.Id;
    }

    public override bool Equals(object? obj) => obj is Entity entity && Equals(entity);

    public override int GetHashCode() => HashCode.Combine(GetType(), Id);

    public static bool operator ==(Entity? left, Entity? right) =>
        left is null ? right is null : left.Equals(right);

    public static bool operator !=(Entity? left, Entity? right) => !(left == right);
}

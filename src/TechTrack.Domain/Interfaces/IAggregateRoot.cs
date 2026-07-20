namespace TechTrack.Domain.Interfaces;

/// <summary>
/// Marcador de raíz de agregado. Los repositorios genéricos se restringirán
/// a este contrato para impedir repositorios de entidades internas.
/// </summary>
public interface IAggregateRoot;

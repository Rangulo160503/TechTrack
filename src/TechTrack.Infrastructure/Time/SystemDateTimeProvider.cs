using TechTrack.Application.Common.Interfaces;

namespace TechTrack.Infrastructure.Time;

public sealed class SystemDateTimeProvider : IDateTimeProvider
{
    public DateTime UtcNow => DateTime.UtcNow;
}

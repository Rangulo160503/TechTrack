using TechTrack.Domain.Common;
using TechTrack.Domain.ValueObjects;

namespace TechTrack.Domain.Entities;

/// <summary>
/// Proveedor de equipos o servicios.
/// </summary>
public class Supplier : AggregateRoot
{
    public const int NameMaxLength = 150;
    public const int ContactNameMaxLength = 150;
    public const int AddressMaxLength = 300;

    public string Name { get; private set; }

    public string? ContactName { get; private set; }

    public Email? Email { get; private set; }

    public PhoneNumber? Phone { get; private set; }

    public string? Address { get; private set; }

    protected Supplier()
    {
        Name = null!;
    }

    public Supplier(
        string name,
        string? contactName = null,
        Email? email = null,
        PhoneNumber? phone = null,
        string? address = null)
        : base(Guid.NewGuid())
    {
        Name = Guard.AgainstNullOrWhiteSpace(name, NameMaxLength, nameof(name));
        ContactName = Guard.AgainstTooLongOptional(contactName, ContactNameMaxLength, nameof(contactName));
        Email = email;
        Phone = phone;
        Address = Guard.AgainstTooLongOptional(address, AddressMaxLength, nameof(address));
    }

    public void Update(
        string name,
        string? contactName,
        Email? email,
        PhoneNumber? phone,
        string? address)
    {
        Name = Guard.AgainstNullOrWhiteSpace(name, NameMaxLength, nameof(name));
        ContactName = Guard.AgainstTooLongOptional(contactName, ContactNameMaxLength, nameof(contactName));
        Email = email;
        Phone = phone;
        Address = Guard.AgainstTooLongOptional(address, AddressMaxLength, nameof(address));
    }
}

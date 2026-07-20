using FluentAssertions;
using TechTrack.Domain.Entities;
using TechTrack.Domain.ValueObjects;

namespace TechTrack.UnitTests.Domain.Entities;

/// <summary>
/// Pruebas de los catálogos con la misma forma que Category (Brand, Department, Supplier, Location).
/// </summary>
public class CatalogEntitiesTests
{
    [Fact]
    public void Brand_Constructor_ShouldCreateAndTrim()
    {
        var brand = new Brand(" HP ");

        brand.Id.Should().NotBeEmpty();
        brand.Name.Should().Be("HP");
    }

    [Fact]
    public void Brand_Update_WithInvalidName_ShouldThrowArgumentException()
    {
        var brand = new Brand("Dell");

        var act = () => brand.Update("  ", null);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Department_Constructor_ShouldCreate()
    {
        var department = new Department("Laboratorio de Cómputo", "Laboratorio principal");

        department.Name.Should().Be("Laboratorio de Cómputo");
        department.IsActive.Should().BeTrue();
    }

    [Fact]
    public void Supplier_Constructor_WithContactData_ShouldStoreValueObjects()
    {
        var supplier = new Supplier(
            "Tecno CR S.A.",
            "Carlos Jiménez",
            new Email("ventas@tecnocr.com"),
            new PhoneNumber("2233-4455"),
            "San José, Costa Rica");

        supplier.Email!.Value.Should().Be("ventas@tecnocr.com");
        supplier.Phone!.Value.Should().Be("22334455");
        supplier.ContactName.Should().Be("Carlos Jiménez");
    }

    [Fact]
    public void Supplier_Constructor_WithOnlyName_ShouldAllowNullContactData()
    {
        var supplier = new Supplier("Proveedor Local");

        supplier.Email.Should().BeNull();
        supplier.Phone.Should().BeNull();
        supplier.ContactName.Should().BeNull();
        supplier.Address.Should().BeNull();
    }

    [Fact]
    public void Location_Constructor_ShouldStoreCode()
    {
        var location = new Location("Laboratorio 1", new LocationCode("LAB-01"), "Pabellón A");

        location.Code.Value.Should().Be("LAB-01");
        location.Name.Should().Be("Laboratorio 1");
    }

    [Fact]
    public void Location_Constructor_WithNullCode_ShouldThrowArgumentNullException()
    {
        var act = () => new Location("Laboratorio 1", null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Location_ChangeCode_ShouldReplaceCode()
    {
        var location = new Location("Laboratorio 1", new LocationCode("LAB-01"));

        location.ChangeCode(new LocationCode("LAB-02"));

        location.Code.Value.Should().Be("LAB-02");
    }
}

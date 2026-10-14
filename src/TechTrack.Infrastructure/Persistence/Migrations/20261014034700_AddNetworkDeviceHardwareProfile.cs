using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using TechTrack.Infrastructure.Persistence;

#nullable disable

namespace TechTrack.Infrastructure.Persistence.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20261014034700_AddNetworkDeviceHardwareProfile")]
    /// <inheritdoc />
    public partial class AddNetworkDeviceHardwareProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "HardwareProfileJson",
                table: "NetworkDevices",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OsVersion",
                table: "NetworkDevices",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HardwareProfileJson",
                table: "NetworkDevices");

            migrationBuilder.DropColumn(
                name: "OsVersion",
                table: "NetworkDevices");
        }
    }
}

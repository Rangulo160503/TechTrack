using System.Management;
using System.Runtime.InteropServices;
using System.Runtime.Versioning;
using System.Text.Json;

namespace TechTrack.PresenceClient;

public sealed record HardwareComponentDto(string Category, string Name, string Detail);

/// <summary>
/// Inventario local del equipo donde corre Presence Client (para troubleshooting).
/// </summary>
[SupportedOSPlatform("windows")]
public static class SystemProfileCollector
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public static (string? OsVersion, string? HardwareProfileJson) TryCollect()
    {
        try
        {
            var components = new List<HardwareComponentDto>();
            var osVersion = RuntimeInformation.OSDescription;

            if (OperatingSystem.IsWindows())
            {
                osVersion = QueryWmi(
                    "SELECT Caption, Version, BuildNumber FROM Win32_OperatingSystem",
                    row =>
                    {
                        var caption = row["Caption"]?.ToString()?.Trim();
                        var version = row["Version"]?.ToString()?.Trim();
                        var build = row["BuildNumber"]?.ToString()?.Trim();
                        return string.Join(' ', new[] { caption, version, build is null ? null : $"build {build}" }
                            .Where(s => !string.IsNullOrWhiteSpace(s)));
                    }) ?? osVersion;

                var cpu = QueryWmi(
                    "SELECT Name, NumberOfCores, NumberOfLogicalProcessors FROM Win32_Processor",
                    row =>
                    {
                        var name = row["Name"]?.ToString()?.Trim() ?? "CPU";
                        var cores = row["NumberOfCores"];
                        var logical = row["NumberOfLogicalProcessors"];
                        return $"{name} · {cores} núcleos · {logical} lógicos";
                    });
                if (cpu is not null)
                {
                    components.Add(new HardwareComponentDto("Procesador", "CPU", cpu));
                }

                var ram = QueryWmi(
                    "SELECT TotalPhysicalMemory FROM Win32_ComputerSystem",
                    row =>
                    {
                        if (row["TotalPhysicalMemory"] is null
                            || !ulong.TryParse(row["TotalPhysicalMemory"].ToString(), out var bytes))
                        {
                            return null;
                        }

                        var gib = bytes / (1024d * 1024d * 1024d);
                        return $"{gib:0.#} GB";
                    });
                if (ram is not null)
                {
                    components.Add(new HardwareComponentDto("Memoria", "RAM", ram));
                }

                foreach (var disk in QueryWmiMany(
                             "SELECT Model, Size, InterfaceType FROM Win32_DiskDrive",
                             row =>
                             {
                                 var model = row["Model"]?.ToString()?.Trim() ?? "Disco";
                                 var size = row["Size"];
                                 var iface = row["InterfaceType"]?.ToString()?.Trim();
                                 var sizeLabel = ulong.TryParse(size?.ToString(), out var bytes)
                                     ? $"{bytes / (1024d * 1024d * 1024d):0.#} GB"
                                     : "?";
                                 return new HardwareComponentDto(
                                     "Almacenamiento",
                                     model,
                                     string.IsNullOrWhiteSpace(iface) ? sizeLabel : $"{sizeLabel} · {iface}");
                             }))
                {
                    components.Add(disk);
                }
            }

            components.Add(
                new HardwareComponentDto(
                    "Sistema",
                    "Arquitectura",
                    RuntimeInformation.OSArchitecture.ToString()));
            components.Add(
                new HardwareComponentDto(
                    "Sistema",
                    "Procesadores lógicos",
                    Environment.ProcessorCount.ToString()));

            foreach (var drive in DriveInfo.GetDrives().Where(d => d.IsReady && d.DriveType == DriveType.Fixed))
            {
                var total = drive.TotalSize / (1024d * 1024d * 1024d);
                var free = drive.AvailableFreeSpace / (1024d * 1024d * 1024d);
                components.Add(
                    new HardwareComponentDto(
                        "Volúmenes",
                        drive.Name.TrimEnd('\\'),
                        $"{total:0.#} GB total · {free:0.#} GB libre · {drive.DriveFormat}"));
            }

            return (osVersion, JsonSerializer.Serialize(components, JsonOptions));
        }
        catch
        {
            return (RuntimeInformation.OSDescription, null);
        }
    }

    private static string? QueryWmi(string query, Func<ManagementBaseObject, string?> map)
    {
        try
        {
            using var searcher = new ManagementObjectSearcher(query);
            foreach (var obj in searcher.Get())
            {
                using (obj)
                {
                    var value = map(obj);
                    if (!string.IsNullOrWhiteSpace(value))
                    {
                        return value;
                    }
                }
            }
        }
        catch
        {
            // Best-effort on locked-down machines.
        }

        return null;
    }

    private static IEnumerable<HardwareComponentDto> QueryWmiMany(
        string query,
        Func<ManagementBaseObject, HardwareComponentDto?> map)
    {
        var list = new List<HardwareComponentDto>();
        try
        {
            using var searcher = new ManagementObjectSearcher(query);
            foreach (var obj in searcher.Get())
            {
                using (obj)
                {
                    var item = map(obj);
                    if (item is not null)
                    {
                        list.Add(item);
                    }
                }
            }
        }
        catch
        {
            // Best-effort.
        }

        return list;
    }
}

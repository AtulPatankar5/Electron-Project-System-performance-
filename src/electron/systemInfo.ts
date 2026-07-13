import { exec } from "child_process";
import os from "os";
import fs from "fs";
import path from "path";
import { app } from "electron";

// ---------------------------------------------------------------------------
// Disk cache for FIXED fields only (machineGuid, systemUuid, diskSerialNumber).
// These never change on a given machine, so we pay the PowerShell/WMI cost
// once per install instead of once per app launch.
// ---------------------------------------------------------------------------

interface HardwareCache {
    machineGuid?: string;
    systemUuid?: string;
    diskSerialNumber?: string;
}

function getCacheFilePath(): string {
    return path.join(app.getPath("userData"), "hw-cache.json");
}

function readCache(): HardwareCache {
    try {
        const raw = fs.readFileSync(getCacheFilePath(), "utf-8");
        return JSON.parse(raw) as HardwareCache;
    } catch {
        return {};
    }
}

function writeCache(partial: HardwareCache): void {
    try {
        const existing = readCache();
        const merged = { ...existing, ...partial };
        fs.writeFileSync(getCacheFilePath(), JSON.stringify(merged, null, 2), "utf-8");
    } catch {
        // Non-fatal — worst case we just re-fetch next launch.
    }
}

function execPromise(command: string, timeoutMs = 5000): Promise<string> {
    return new Promise((resolve) => {
        exec(command, { timeout: timeoutMs }, (error, stdout) => {
            if (error) {
                resolve("");
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

// ---------------------------------------------------------------------------
// Machine GUID (Fixed) — cached after first fetch
// ---------------------------------------------------------------------------

export async function getMachineGuid(): Promise<string> {
    const cached = readCache().machineGuid;
    if (cached) return cached;

    const value = await fetchMachineGuid();
    if (value && value !== "N/A") {
        writeCache({ machineGuid: value });
    }
    return value;
}

async function fetchMachineGuid(): Promise<string> {
    try {
        if (process.platform === "win32") {
            const output = await execPromise('reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid');
            const match = /MachineGuid\s+REG_SZ\s+([a-fA-F0-9-]+)/.exec(output);
            return match ? match[1] : "N/A";
        } else if (process.platform === "darwin") {
            const output = await execPromise("ioreg -rd1 -c IOPlatformExpertDevice");
            const match = /"IOPlatformUUID" = "([^"]+)"/.exec(output);
            return match ? match[1] : "N/A";
        } else {
            const output = await execPromise("cat /etc/machine-id || cat /var/lib/dbus/machine-id");
            return output ? output : "N/A";
        }
    } catch {
        return "N/A";
    }
}

// ---------------------------------------------------------------------------
// System / BIOS UUID (Fixed) — cached after first fetch
// wmic tried first (faster process spawn), PowerShell as fallback
// ---------------------------------------------------------------------------

export async function getSystemUuid(): Promise<string> {
    const cached = readCache().systemUuid;
    if (cached) return cached;

    const value = await fetchSystemUuid();
    if (value && value !== "N/A") {
        writeCache({ systemUuid: value });
    }
    return value;
}

async function fetchSystemUuid(): Promise<string> {
    try {
        if (process.platform === "win32") {
            // Try wmic first — much faster process startup than powershell.
            const wmicOutput = await execPromise("wmic csproduct get uuid");
            const wmicLines = wmicOutput.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
            const wmicUuid = wmicLines[1];
            if (wmicUuid && wmicUuid.toLowerCase() !== "uuid") {
                return wmicUuid;
            }

            // Fallback to PowerShell if wmic is unavailable (deprecated/removed) or empty.
            const psOutput = await execPromise(
                'powershell -NoProfile -Command "Get-CimInstance Win32_ComputerSystemProduct | Select-Object -ExpandProperty UUID"'
            );
            if (psOutput && psOutput.toLowerCase() !== "unknown") return psOutput;

            return "N/A";
        } else if (process.platform === "darwin") {
            const output = await execPromise("ioreg -rd1 -c IOPlatformExpertDevice");
            const match = /"IOPlatformUUID" = "([^"]+)"/.exec(output);
            return match ? match[1] : "N/A";
        } else {
            const output = await execPromise("cat /sys/class/dmi/id/product_uuid");
            return output ? output : "N/A";
        }
    } catch {
        return "N/A";
    }
}

// ---------------------------------------------------------------------------
// Disk Serial Number (Fixed) — cached after first fetch
// wmic tried first, PowerShell as fallback
// ---------------------------------------------------------------------------

export async function getDiskSerialNumber(): Promise<string> {
    const cached = readCache().diskSerialNumber;
    if (cached) return cached;

    const value = await fetchDiskSerialNumber();
    if (value && value !== "N/A") {
        writeCache({ diskSerialNumber: value });
    }
    return value;
}

async function fetchDiskSerialNumber(): Promise<string> {
    try {
        if (process.platform === "win32") {
            // Try wmic first — much faster process startup than powershell.
            const wmicOutput = await execPromise("wmic diskdrive get serialnumber");
            const wmicLines = wmicOutput.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
            const wmicSerials = wmicLines.slice(1).filter((l) => l.toLowerCase() !== "serialnumber");
            if (wmicSerials.length > 0) {
                return wmicSerials.join(", ");
            }

            // Fallback to PowerShell if wmic is unavailable or empty.
            const psOutput = await execPromise(
                'powershell -NoProfile -Command "Get-CimInstance Win32_PhysicalMedia | Select-Object -ExpandProperty SerialNumber"'
            );
            if (psOutput) {
                const list = psOutput.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
                return list.join(", ");
            }

            return "N/A";
        } else if (process.platform === "darwin") {
            const output = await execPromise("system_profiler SPHardwareDataType | grep 'Serial Number'");
            const match = /Serial Number.*:\s*(.+)/.exec(output);
            return match ? match[1] : "N/A";
        } else {
            const output = await execPromise("lsblk --nodeps -o SERIAL -n");
            return output ? output.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).join(", ") : "N/A";
        }
    } catch {
        return "N/A";
    }
}

// ---------------------------------------------------------------------------
// CPU details (Fixed: model/cores/arch, Dynamic: speed) — no subprocess, no caching needed
// ---------------------------------------------------------------------------

export function getCpuDetails() {
    const cpus = os.cpus();
    return {
        model: cpus[0]?.model || "Unknown",
        speed: cpus[0]?.speed || 0,
        cores: cpus.length,
        arch: os.arch(),
    };
}

// ---------------------------------------------------------------------------
// Network interfaces (Dynamic IP, Fixed/Semi-Fixed MAC) — no subprocess, no caching needed
// ---------------------------------------------------------------------------

export function getNetworkInterfaces() {
    const interfaces = os.networkInterfaces();
    const result: { interfaceName: string; v4: string; v6: string; mac: string }[] = [];
    for (const [name, netInterface] of Object.entries(interfaces)) {
        if (!netInterface) continue;
        let v4 = "";
        let v6 = "";
        let mac = "";
        for (const info of netInterface) {
            if (info.internal) continue;
            if (info.family === "IPv4") {
                v4 = info.address;
            } else if (info.family === "IPv6") {
                v6 = info.address;
            }
            if (info.mac && info.mac !== "00:00:00:00:00:00") {
                mac = info.mac;
            }
        }
        if (v4 || v6) {
            result.push({
                interfaceName: name,
                v4: v4 || "N/A",
                v6: v6 || "N/A",
                mac: mac || "N/A",
            });
        }
    }
    return result;
}

// ---------------------------------------------------------------------------
// OS Version (Fixed) — no subprocess on win32, not cached since it's already <1ms
// ---------------------------------------------------------------------------

export async function getOsVersion(): Promise<string> {
    if (process.platform === "win32") {
        return os.version() || "Windows";
    } else if (process.platform === "darwin") {
        try {
            const version = await execPromise("sw_vers -productVersion");
            return version ? `macOS ${version}` : os.version() || "macOS";
        } catch {
            return os.version() || "macOS";
        }
    } else {
        try {
            const content = await execPromise("cat /etc/os-release");
            const nameMatch = /^PRETTY_NAME="?([^"\n]+)"?/m.exec(content);
            if (nameMatch) return nameMatch[1];
        } catch {
            // ignore
        }
        return os.version() || "Linux";
    }
}

// ---------------------------------------------------------------------------
// OS Build/Patch (Dynamic — changes with updates) — NEVER cached, reg query is
// already fast (~15-40ms) so caching would only risk showing a stale build number.
// ---------------------------------------------------------------------------

export async function getOsPatch(): Promise<string> {
    if (process.platform === "win32") {
        try {
            const output = await execPromise('reg query "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion" /v UBR');
            const match = /UBR\s+REG_DWORD\s+0x([a-fA-F0-9]+)/.exec(output);
            if (match) {
                return parseInt(match[1], 16).toString();
            }
        } catch {
            // ignore
        }
        return "N/A";
    } else if (process.platform === "darwin") {
        try {
            const build = await execPromise("sw_vers -buildVersion");
            return build || "N/A";
        } catch {
            return "N/A";
        }
    } else {
        try {
            const kernel = await execPromise("uname -r");
            return kernel || "N/A";
        } catch {
            return "N/A";
        }
    }
}
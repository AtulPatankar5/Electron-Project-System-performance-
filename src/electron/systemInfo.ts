import { exec } from "child_process";
import os from "os";

function execPromise(command: string): Promise<string> {
    return new Promise((resolve) => {
        exec(command, (error, stdout) => {
            if (error) {
                resolve("");
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

export async function getMachineGuid(): Promise<string> {
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

export async function getSystemUuid(): Promise<string> {
    try {
        if (process.platform === "win32") {
            const output = await execPromise('powershell -Command "Get-CimInstance Win32_ComputerSystemProduct | Select-Object -ExpandProperty UUID"');
            if (output && output.toLowerCase() !== "unknown") return output;
            // fallback
            const outputFallback = await execPromise("wmic csproduct get uuid");
            const lines = outputFallback.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            return lines[1] || "N/A";
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

export async function getDiskSerialNumber(): Promise<string> {
    try {
        if (process.platform === "win32") {
            const output = await execPromise('powershell -Command "Get-CimInstance Win32_PhysicalMedia | Select-Object -ExpandProperty SerialNumber"');
            if (output) {
                const list = output.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                return list.join(", ");
            }
            // fallback
            const outputFallback = await execPromise("wmic diskdrive get serialnumber");
            const lines = outputFallback.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            return lines.slice(1).join(", ") || "N/A";
        } else if (process.platform === "darwin") {
            const output = await execPromise("system_profiler SPHardwareDataType | grep 'Serial Number'");
            const match = /Serial Number.*:\s*(.+)/.exec(output);
            return match ? match[1] : "N/A";
        } else {
            const output = await execPromise("lsblk --nodeps -o SERIAL -n");
            return output ? output.split(/\r?\n/).map(s => s.trim()).filter(Boolean).join(", ") : "N/A";
        }
    } catch {
        return "N/A";
    }
}

export function getCpuDetails() {
    const cpus = os.cpus();
    return {
        model: cpus[0]?.model || "Unknown",
        speed: cpus[0]?.speed || 0,
        cores: cpus.length,
        arch: os.arch()
    };
}

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
                mac: mac || "N/A"
            });
        }
    }
    return result;
}

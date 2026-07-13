import osUtils from "os-utils";
import fs from "fs";
import os from "os";
import { BrowserWindow } from "electron";
import { ipcWebContentsSend } from "./util.js";
import {
    getMachineGuid,
    getSystemUuid,
    getDiskSerialNumber,
    getCpuDetails,
    getNetworkInterfaces,
    getOsVersion,
    getOsPatch,
} from "./systemInfo.js";

// os-utils' cpuUsage() takes ~1000ms internally (two CPU time snapshots,
// ~1s apart) to compute an accurate percentage. Polling faster than that
// causes overlapping/stacked measurements and stale-looking values, so the
// interval now matches that sampling window instead of firing every 500ms.
const POLLING_INTERVAL = 1;

let pollingActive = false;

export function pollResources(mainWindow: BrowserWindow) {
    setInterval(async () => {
        // Guard against overlapping ticks in case a previous cycle is still
        // resolving (e.g. a slow disk read) when the next interval fires.
        if (pollingActive) return;
        pollingActive = true;

        try {
            const [cpuUsage, ramUsage, storageUsage] = await Promise.all([
                getCpuUsages(),
                Promise.resolve(getRamUsages()),
                Promise.resolve(getstorageUsage()),
            ]);

            ipcWebContentsSend("statistics", mainWindow.webContents, {
                cpuUsage,
                ramUsage,
                storageUsage: storageUsage.usage,
            });
        } finally {
            pollingActive = false;
        }
    }, POLLING_INTERVAL);
}

export async function getStaticData(): Promise<StaticData> {
    const totalStorage = getstorageUsage().total;
    const cpuModel = os.cpus()[0].model;
    const totalMemoryGB = Math.floor(osUtils.totalmem() / 1024);

    // These all run in parallel now instead of sequentially. The three
    // fixed fields (machineGuid, systemUuid, diskSerialNumber) are also
    // cached to disk inside systemInfo.ts, so this whole block is only
    // slow on first launch after install — subsequent launches read from
    // the cache and finish in a few ms each.
    const [
        machineGuid,
        systemUuid,
        diskSerialNumber,
        osVersion,
        osPatch,
    ] = await Promise.all([
        getMachineGuid(),
        getSystemUuid(),
        getDiskSerialNumber(),
        getOsVersion(),
        getOsPatch(),
    ]);

    const cpuDetails = getCpuDetails();
    const networkInterfaces = getNetworkInterfaces();

    return {
        totalStorage,
        cpuModel,
        totalMemoryGB,
        machineGuid,
        systemUuid,
        diskSerialNumber,
        cpuDetails,
        networkInterfaces,
        osVersion,
        osPatch,
    };
}

function getCpuUsages(): Promise<number> {
    return new Promise((resolve) => {
        osUtils.cpuUsage(resolve);
    });
}

function getRamUsages() {
    return 1 - osUtils.freememPercentage();
}

function getstorageUsage() {
    const stats = fs.statfsSync(process.platform === "win32" ? "C://" : "/");
    const total = stats.bsize * stats.blocks;
    const free = stats.bsize * stats.bfree;

    return {
        total: Math.floor(total / 1_000_000_000),
        usage: 1 - free / total,
    };
}
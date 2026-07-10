import osUtils from "os-utils";
import fs from "fs";
import os from "os";
import { BrowserWindow } from "electron";
import { ipcWebContentsSend } from "./util.js";
import { getMachineGuid, getSystemUuid, getDiskSerialNumber, getCpuDetails, getNetworkInterfaces } from "./systemInfo.js";

const POLLING_INTERVAL = 500;

export function pollResources(mainWindow: BrowserWindow) {
    setInterval(async () => {
        const cpuUsage = await getCpuUsages();
        const ramUsage = getRamUsages();
        const storageUsage = getstorageUsage();
        ipcWebContentsSend("statistics", mainWindow.webContents, {
            cpuUsage,
            ramUsage,
            storageUsage: storageUsage.usage,
        });
    }, POLLING_INTERVAL);
}

export async function getStaticData(): Promise<StaticData> {
    const totalStorage = getstorageUsage().total;
    const cpuModel = os.cpus()[0].model;
    const totalMemoryGB = Math.floor(osUtils.totalmem() / 1024);
    
    const machineGuid = await getMachineGuid();
    const systemUuid = await getSystemUuid();
    const diskSerialNumber = await getDiskSerialNumber();
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
        networkInterfaces
    };
}


function getCpuUsages(): Promise<number> {
    return new Promise((resolve) => {
        osUtils.cpuUsage(resolve);
    })
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
        usage: 1 - free / total
    }
}
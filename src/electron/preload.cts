import { IpcRendererEvent } from "electron";
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    subscribeStatistics: (callback) => ipcOn("statistics", (stats) => { callback(stats) }),
    getStaticData: () => ipcInvoke("getStaticData"),
    subscribeChangeView: (callback) => ipcOn("changeView", (stats) => { callback(stats) }),
    sendFrameAction: (payload) => ipcSend("sendFrameAction", payload)
} satisfies Window["electron"]);

function ipcInvoke<Key extends keyof EventPayloadMapping>(key: Key): Promise<EventPayloadMapping[Key]> {
    return ipcRenderer.invoke(key);
}

function ipcOn<Key extends keyof EventPayloadMapping>(key: Key, callback: (payload: EventPayloadMapping[Key]) => void) {
    const cb = (_: IpcRendererEvent, payload: any) => callback(payload);
    ipcRenderer.on(key, cb);
    return () => ipcRenderer.off(key, cb);
}
function ipcSend<Key extends keyof EventPayloadMapping>(key: Key, payload: EventPayloadMapping[Key]) {
    ipcRenderer.send(key, payload);
}
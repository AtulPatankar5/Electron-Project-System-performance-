import { app, BrowserWindow, Menu } from "electron";
import { ipcWebContentsSend, isDev } from "./util.js";

export function getAppMenu(mainWindow: BrowserWindow): Menu {
    return Menu.buildFromTemplate([
        {
            label: 'Quit',
            click: app.quit
        },
        {
            label: 'Devtools',
            click: () => mainWindow.webContents.openDevTools(),
            visible: isDev()
        }
    ]);
}

export function getViewMenu(mainWindow: BrowserWindow): Menu {
    return Menu.buildFromTemplate([
        {
            label: 'CPU',
            click: () => ipcWebContentsSend('changeView', mainWindow.webContents, "CPU")
        },
        {
            label: 'RAM',
            click: () => ipcWebContentsSend('changeView', mainWindow.webContents, "RAM")
        },
        {
            label: 'STORAGE',
            click: () => ipcWebContentsSend('changeView', mainWindow.webContents, "STORAGE")
        },
    ]);
}

export function createMenu(mainWindow: BrowserWindow) {
    Menu.setApplicationMenu(
        Menu.buildFromTemplate([
            {
                label: process.platform === "darwin" ? "" : 'App',
                type: 'submenu',
                submenu: getAppMenu(mainWindow)
            },
            {
                label: 'View',
                type: 'submenu',
                submenu: getViewMenu(mainWindow)
            }
        ])
    )
} 
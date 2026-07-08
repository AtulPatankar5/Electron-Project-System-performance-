import { app, BrowserWindow, Menu, Tray } from "electron";
import { ipcMainHandle, ipcMainOn, isDev } from "./util.js";
import { getStaticData, pollResources } from "./resourceManager.js";
import { getAssetsPath, getPreloadPath, getUIPath } from "./pathResolver.js";
import path from "path";
import { createTray } from "./tray.js";
import { createMenu } from "./menu.js";

// Menu.setApplicationMenu(null);

app.on("ready", () => {
    const mainWindow = new BrowserWindow({
        webPreferences: {
            preload: getPreloadPath()
        },
        frame: false
    });
    console.log("isDev()-->", isDev());
    if (isDev()) {
        mainWindow.loadURL("http://localhost:5123");
    } else {
        mainWindow.loadFile(getUIPath());
    }

    pollResources(mainWindow);


    ipcMainHandle("getStaticData", () => getStaticData());

    ipcMainOn('sendFrameAction', (payload) => {
        switch (payload) {
            case 'CLOSE':
                mainWindow.close();
                break;
            case 'MAXIMIZE':
                mainWindow.maximize();
                break;
            case 'MINIMIZE':
                mainWindow.minimize();
                break;
        }
    })

    createTray(mainWindow);

    handleCloseEvents(mainWindow);
    createMenu(mainWindow);
})

function handleCloseEvents(mainWindow: BrowserWindow) {
    let willClose = false;
    if (willClose) {
        return;
    }

    //once clicked on window, then it will close the window using below method 'close'
    mainWindow.on('close', (e) => {
        e.preventDefault();

        //this hides the window but still make it opens in tray
        mainWindow.hide();

        //hides from app dock. Only for MAC applicable. IN windows it closes automatically
        if (app.dock) {
            app.dock.hide();
        }
    })

    //This time, the app is quitting. Don't hide the window—let it close.
    app.on("before-quit", () => {
        willClose = true;
    })

    //The app is back to normal. If the user clicks on tray then open the window.
    mainWindow.on('show', () => {
        willClose = false;
    })
}


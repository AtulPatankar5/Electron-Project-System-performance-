import { app, BrowserWindow, Menu, Tray } from "electron";
import path from "path";
import { getAssetsPath } from "./pathResolver.js";

// options only for right bottom tray
export function createTray(mainWindow: BrowserWindow) {
    const tray = new Tray(path.join(getAssetsPath(), "icon.png"));

    //to close it from tray 
    tray.setContextMenu(Menu.buildFromTemplate([
        {
            label: 'Show',
            click: () => {
                mainWindow.show(); // when user clicks on tray then it opens the window again
                if (app.dock) {// mac only 
                    app.dock.show();
                }
            }
        },
        {
            label: 'Quit', //to close it from tray
            click: () => app.quit()
        }
    ]))

}
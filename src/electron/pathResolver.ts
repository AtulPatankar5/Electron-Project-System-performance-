import { app } from "electron";
import path from "node:path";
import { isDev } from "./util.js";


export function getPreloadPath() {
    return path.join(
        app.getAppPath(),
        isDev() ? "." : "..",
        "dist-electron",
        "preload.cjs"
    );
}

export function getUIPath() {
    return path.join(
        app.getAppPath(),
        "dist-react",
        "index.html"
    );
}

export function getAssetsPath() {
    console.log("process.resourcesPath-->", process.resourcesPath);
    if (app.isPackaged) {
        return path.join(process.resourcesPath, "assets");
    }

    return path.join(
        app.getAppPath(),
        "src",
        "assets"
    );
}
type Statistics = {
    cpuUsage: number,
    ramUsage: number,
    storageUsage: number
}

type StaticData = {
    totalStorage: number,
    cpuModel: string,
    totalMemoryGB: number
}


type View = "CPU" | "STORAGE" | "RAM";

type FrameWindowAction = 'CLOSE' | 'MAXIMIZE' | 'MINIMIZE' | 'SHOW_APP_MENU' | 'SHOW_VIEW_MENU'

type EventPayloadMapping = {
    statistics: Statistics,
    getStaticData: StaticData
    changeView: View,
    sendFrameAction: FrameWindowAction

}

type UnsubscribeFunction = () => void;
interface Window {
    electron: {
        subscribeStatistics: (callback: (statistics: Statistics) => void) => UnsubscribeFunction;
        getStaticData: () => Promise<StaticData>;
        subscribeChangeView: (callback: (view: View) => void) => UnsubscribeFunction;
        sendFrameAction: (payload: FrameWindowAction) => void;
    }
}



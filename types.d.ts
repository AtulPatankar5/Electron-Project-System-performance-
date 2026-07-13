type Statistics = {
    cpuUsage: number,
    ramUsage: number,
    storageUsage: number
}
type SelectOptionProps = {
    title: View;
    subtitle: string | number;
    data: number[];
    onclick: () => void;
};

type CpuDetails = {
    model: string;
    speed: number;
    cores: number;
    arch: string;
}

type NetworkInterfaceInfo = {
    interfaceName: string;
    v4: string;
    v6: string;
    mac: string;
}

type StaticData = {
    totalStorage: number,
    cpuModel: string,
    totalMemoryGB: number,
    machineGuid: string,
    systemUuid: string,
    diskSerialNumber: string,
    cpuDetails: CpuDetails,
    networkInterfaces: NetworkInterfaceInfo[],
    osVersion: string,
    osPatch: string
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



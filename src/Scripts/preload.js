const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('myAPI', {
    initializeSettings: () => ipcRenderer.invoke('initializeSettings'),
    saveFloorSettings: (numFloors, floorNames) => ipcRenderer.invoke('saveFloorSettings', numFloors, floorNames),
    saveGeneralSettings: (ip, username, password, connectionType) =>
        ipcRenderer.invoke('saveGeneralSettings', ip, username, password, connectionType),
    getConnectionStatus: () => ipcRenderer.invoke('getConnectionStatus'),
    reconnect: () => ipcRenderer.invoke('reconnect'),
    saveLight: (light) => ipcRenderer.invoke('saveLight', light),
    saveSceneButton: (button) => ipcRenderer.invoke('saveSceneButton', button),
    savePageButton: (button) => ipcRenderer.invoke('savePageButton', button),
    copyFloorImage: (floorNumber, sourcePath) => ipcRenderer.invoke('copyFloorImage', floorNumber, sourcePath),
    pathForFile: (file) => webUtils.getPathForFile(file),
    sendCommand: (command) => ipcRenderer.invoke('sendCommand', command),
    onConnectionStatus: (callback) => {
        const listener = (_event, status) => callback(status);
        ipcRenderer.on('connection-status', listener);
        return () => ipcRenderer.removeListener('connection-status', listener);
    },
    onTcpMessage: (callback) => {
        const listener = (_event, message) => callback(message);
        ipcRenderer.on('tcp-message', listener);
        return () => ipcRenderer.removeListener('tcp-message', listener);
    },
});

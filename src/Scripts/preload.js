const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('myAPI', {
    initializeSettings: () => ipcRenderer.invoke('initializeSettings'),
    saveFloorSettings: (numFloors, floorNames) => ipcRenderer.invoke('saveFloorSettings', numFloors, floorNames),
    saveGeneralSettings: (ip, username, password) => ipcRenderer.invoke('saveGeneralSettings', ip, username, password),
    saveLight: (light) => ipcRenderer.invoke('saveLight', light),
    copyFloorImage: (floorNumber, sourcePath) => ipcRenderer.invoke('copyFloorImage', floorNumber, sourcePath),
    pathForFile: (file) => webUtils.getPathForFile(file),
    sendTcpCommand: (command) => ipcRenderer.invoke('sendTcpCommand', command),
    setIpAddress: (ip) => ipcRenderer.invoke('setIpAddress', ip),
    onTcpMessage: (callback) => {
        const listener = (_event, message) => callback(message);
        ipcRenderer.on('tcp-message', listener);
        return () => ipcRenderer.removeListener('tcp-message', listener);
    },
});

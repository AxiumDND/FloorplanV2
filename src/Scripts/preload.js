const { contextBridge, ipcRenderer } = require('electron');

// Expose functions through the context bridge
contextBridge.exposeInMainWorld('myAPI', {
    initializeSettings: () => ipcRenderer.invoke('initializeSettings'),
    readFile: (filePath, encoding = 'utf8') => ipcRenderer.invoke('readFile', filePath, encoding),
    writeFile: (filePath, data, encoding = 'utf8') => ipcRenderer.invoke('writeFile', filePath, data, encoding),
    saveSettingsToFile: (filePath, numFloors, floorNames) => ipcRenderer.invoke('saveSettingsToFile', filePath, numFloors, floorNames),
    saveGeneralSettings: (filePath, ip, username, password) => ipcRenderer.invoke('saveGeneralSettings', filePath, ip, username, password),
    saveLightPosition: (lightId, newX, newY) => ipcRenderer.invoke('saveLightPosition', lightId, newX, newY),
    sendTcpCommand: (command) => ipcRenderer.invoke('sendTcpCommand', command),
    setIpAddress: (ip) => ipcRenderer.invoke('setIpAddress', ip)
});

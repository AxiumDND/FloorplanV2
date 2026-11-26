const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const winston = require('winston');
const {
    setIpAddress,
    sendTcpCommand,
    readFile,
    writeFile,
    saveSettingsToFile,
    saveGeneralSettings,
    updateLightPosition,
    setupTcpClient
} = require('./src/Scripts/mainFunctions');

winston.configure({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}] ${message}`)
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'src', 'Scripts', 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
        }
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    winston.info('Main window created and loaded');
}

// Create a new BrowserWindow when `app` is ready
app.on('ready', createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Re-create a window in the app when the dock icon is clicked
// and there are no other windows open (macOS)
app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// IPC Handlers
ipcMain.handle('initializeSettings', async () => {
    const filePath = 'userData/settings.csv';
    try {
        const settingsData = await readFile(filePath, 'utf8');
        winston.info('Settings data initialized successfully.');
        return settingsData; // Return the settings data for use by the renderer
    } catch (error) {
        winston.error(`Failed to initialize settings: ${error.message}`);
        throw new Error(`Failed to initialize settings: ${error.message}`);
    }
});

ipcMain.handle('readFile', async (event, filePath, encoding = 'utf8') => {
    try {
        const data = await readFile(filePath, encoding);
        return { success: true, data };
    } catch (error) {
        winston.error(`Failed to read file: ${error.message}`);
        return { success: false, error: `Failed to read file: ${error.message}` };
    }
});

ipcMain.handle('writeFile', async (event, filePath, data, encoding = 'utf8') => {
    try {
        await writeFile(filePath, data, encoding);
        return { success: true };
    } catch (error) {
        winston.error(`Failed to write file: ${error.message}`);
        return { success: false, error: `Failed to write file: ${error.message}` };
    }
});

ipcMain.handle('saveSettingsToFile', async (event, filePath, numFloors, floorNames) => {
    try {
        await saveSettingsToFile(filePath, numFloors, floorNames);
        return { success: true };
    } catch (error) {
        winston.error(`Failed to save settings: ${error.message}`);
        return { success: false, error: `Failed to save settings: ${error.message}` };
    }
});

ipcMain.handle('saveGeneralSettings', async (event, filePath, ip, username, password) => {
    try {
        await saveGeneralSettings(filePath, ip, username, password);
        return { success: true };
    } catch (error) {
        winston.error(`Failed to save general settings: ${error.message}`);
        return { success: false, error: `Failed to save general settings: ${error.message}` };
    }
});

ipcMain.handle('saveLightPosition', async (event, lightId, newX, newY) => {
    try {
        await updateLightPosition(lightId, newX, newY);
        return { success: true };
    } catch (error) {
        winston.error(`Failed to save light position: ${error.message}`);
        return { success: false, error: `Failed to save light position: ${error.message}` };
    }
});

ipcMain.handle('setIpAddress', (event, ip) => {
    try {
        setIpAddress(ip);
        winston.info(`IP Address set to: ${ip}`);
        return { success: true };
    } catch (error) {
        winston.error(`Failed to set IP address: ${error.message}`);
        return { success: false, error: `Failed to set IP address: ${error.message}` };
    }
});

ipcMain.handle('sendTcpCommand', (event, command) => {
    try {
        sendTcpCommand(command);
        winston.info(`TCP command sent: ${command}`);
        return { success: true };
    } catch (error) {
        winston.error(`Failed to send TCP command: ${error.message}`);
        return { success: false, error: `Failed to send TCP command: ${error.message}` };
    }
});

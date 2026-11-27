const { app, BrowserWindow, ipcMain, protocol, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');
const winston = require('winston');
const {
    setDataDir,
    setSecretStore,
    setGatewayMessageHandler,
    setConnectionStatusHandler,
    ensureSettings,
    getSettings,
    connectFromSettings,
    getConnectionStatus,
    sendCommand,
    saveFloorSettings,
    saveGeneralSettings,
    saveLight,
    saveSceneButton,
    savePageButton,
    copyFloorImage,
} = require('./src/Scripts/mainFunctions');
const { createElectronSecrets } = require('./src/Scripts/electronSecrets');

protocol.registerSchemesAsPrivileged([
    {
        scheme: 'floorplan',
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true,
            corsEnabled: true,
            stream: true,
        },
    },
]);

let mainWindow = null;
let dataDir = null;

function getDataDir() {
    if (app.isPackaged) {
        return path.join(app.getPath('userData'), 'floorplan-data');
    }
    return path.join(__dirname, 'userData');
}

function configureLogging() {
    winston.configure({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}] ${message}`)
        ),
        transports: [
            new winston.transports.Console(),
            new winston.transports.File({ filename: path.join(dataDir, 'floorplan.log') }),
        ],
    });
}

function registerFloorImageProtocol() {
    protocol.handle('floorplan', (request) => {
        const fileName = path.basename(new URL(request.url).pathname);
        if (!/^floor-[1-6]-image\.png$/.test(fileName)) {
            return new Response('Not found', { status: 404 });
        }

        const filePath = path.join(dataDir, fileName);
        if (!fs.existsSync(filePath)) {
            return new Response('Not found', { status: 404 });
        }

        const body = fs.readFileSync(filePath);
        return new Response(body, {
            headers: { 'Content-Type': 'image/png' },
        });
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 750,
        webPreferences: {
            preload: path.join(__dirname, 'src', 'Scripts', 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    winston.info('Main window created and loaded');
}

function handle(channel, fn) {
    ipcMain.handle(channel, async (_event, ...args) => {
        try {
            const data = await fn(...args);
            return { success: true, data };
        } catch (error) {
            winston.error(`${channel}: ${error.message}`);
            return { success: false, error: error.message };
        }
    });
}

function registerIpc() {
    handle('initializeSettings', () => getSettings());
    handle('saveFloorSettings', (numFloors, floorNames) => saveFloorSettings(numFloors, floorNames));
    handle('saveGeneralSettings', (ip, username, password, connectionType, clearPassword) =>
        saveGeneralSettings(ip, username, password, connectionType, clearPassword)
    );
    handle('getConnectionStatus', () => getConnectionStatus());
    handle('reconnect', () => connectFromSettings());
    handle('saveLight', (light) => saveLight(light));
    handle('saveSceneButton', (button) => saveSceneButton(button));
    handle('savePageButton', (button) => savePageButton(button));
    handle('copyFloorImage', (floorNumber, sourcePath) => copyFloorImage(floorNumber, sourcePath));
    handle('sendCommand', (command) => {
        sendCommand(command);
        return command;
    });
}

app.whenReady().then(() => {
    dataDir = getDataDir();
    setDataDir(dataDir);
    fs.mkdirSync(dataDir, { recursive: true });
    setSecretStore(createElectronSecrets(safeStorage));
    configureLogging();
    try {
        ensureSettings();
    } catch (error) {
        winston.error(`settings: ${error.message}`);
    }
    registerFloorImageProtocol();
    setGatewayMessageHandler((message) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('tcp-message', message);
        }
    });
    setConnectionStatusHandler((status) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('connection-status', status);
        }
    });
    registerIpc();
    createWindow();
    connectFromSettings().catch((error) => winston.error(`connect: ${error.message}`));
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

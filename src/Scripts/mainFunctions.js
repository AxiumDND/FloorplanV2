const fs = require('fs');
const path = require('path');

const { createGatewayConnection } = require('./gatewayConnection');
const { createSettingsStore, SECRET_ERROR } = require('./settingsStore');

let dataDir = null;
let secrets = null;
let settingsStore = null;
let storeError = null;
let connectionProblem = null;
let onGatewayMessage = () => {};
let onConnectionStatus = () => {};

const connection = createGatewayConnection({
    onMessage: (message) => onGatewayMessage(message),
    onStatus: (status) => {
        // Credentials never go to the log; only the state and target are written.
        console.info(`Connection ${status.state} (${status.type} ${status.host})${status.message ? `: ${status.message}` : ''}`);
        onConnectionStatus(status);
    },
    log: (line) => console.info(line),
});

function setDataDir(dir) {
    dataDir = dir;
    settingsStore = null;
    storeError = null;
    connectionProblem = null;
}

function setGatewayMessageHandler(handler) {
    onGatewayMessage = handler;
}

function setConnectionStatusHandler(handler) {
    onConnectionStatus = handler;
}

const unavailableSecrets = {
    isAvailable: () => false,
    unavailableReason: () => '',
    encrypt: () => {
        throw new Error('Secure password storage is not available.');
    },
    decrypt: () => {
        throw new Error('Secure password storage is not available.');
    },
};

function setSecretStore(store) {
    secrets = store;
    settingsStore = null;
    storeError = null;
}

function getStore() {
    if (!dataDir) {
        throw new Error('Data directory is not set');
    }
    if (storeError) {
        throw storeError;
    }
    if (!settingsStore) {
        const created = createSettingsStore({ dir: dataDir, secrets: secrets || unavailableSecrets });
        try {
            created.load();
        } catch (error) {
            storeError = error;
            throw error;
        }
        settingsStore = created;
    }
    return settingsStore;
}

function ensureSettings() {
    return getStore().view();
}

function getSettings() {
    return getStore().view();
}

async function connectFromSettings() {
    let settings;
    try {
        settings = getStore().getConnectionSettings();
    } catch (error) {
        if (error.code !== SECRET_ERROR) {
            throw error;
        }
        connection.disconnect();
        connectionProblem = { state: 'error', type: 'http', host: '', message: error.message };
        onConnectionStatus(connectionProblem);
        return connectionProblem;
    }
    connectionProblem = null;
    connection.connect(settings);
    return connection.getStatus();
}

function sendCommand(command) {
    return connection.send(command);
}

function getConnectionStatus() {
    return connectionProblem ? { ...connectionProblem } : connection.getStatus();
}

async function saveGeneralSettings(ip, username, password, connectionType, clearPassword) {
    getStore().saveGeneral(ip, username, password, connectionType, clearPassword);
    await connectFromSettings();
    return getStore().view();
}

async function saveFloorSettings(numFloors, floorNames) {
    getStore().saveFloors(numFloors, floorNames);
}

async function saveLight(light) {
    getStore().saveLight(light);
}

async function saveSceneButton(button) {
    getStore().saveScene(button);
}

async function savePageButton(button) {
    getStore().savePage(button);
}

function copyFloorImage(floorNumber, sourcePath) {
    const floor = Number(floorNumber);
    if (!Number.isInteger(floor) || floor < 1 || floor > 6) {
        throw new Error('Floor must be from 1 to 6');
    }
    if (!sourcePath || !fs.existsSync(sourcePath)) {
        throw new Error('Image file was not found');
    }

    const destination = path.join(dataDir, `floor-${floor}-image.png`);
    fs.copyFileSync(sourcePath, destination);
    return destination;
}

module.exports = {
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
};

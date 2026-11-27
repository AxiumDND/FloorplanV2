const fs = require('fs');
const path = require('path');

const { createGatewayConnection, normalizeConnectionType, validateSettings } = require('./gatewayConnection');

let dataDir = null;
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
}

function setGatewayMessageHandler(handler) {
    onGatewayMessage = handler;
}

function setConnectionStatusHandler(handler) {
    onConnectionStatus = handler;
}

function settingsPath() {
    if (!dataDir) {
        throw new Error('Data directory is not set');
    }
    return path.join(dataDir, 'settings.csv');
}

function ensureSettingsFile(examplePath) {
    const filePath = settingsPath();
    fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(filePath)) {
        fs.copyFileSync(examplePath, filePath);
    }
    return filePath;
}

function parseGeneralSettings(settingsData) {
    const read = (key) => {
        const match = settingsData.match(new RegExp(`\\$${key},([^;]*);`));
        return match ? match[1] : '';
    };
    return {
        type: normalizeConnectionType(read('connectionType')),
        host: read('ipAddress').trim(),
        username: read('userName'),
        password: read('password'),
    };
}

async function loadGeneralSettings() {
    return parseGeneralSettings(await readFile(settingsPath(), 'utf8'));
}

async function connectFromSettings() {
    connection.connect(await loadGeneralSettings());
    return connection.getStatus();
}

function sendCommand(command) {
    return connection.send(command);
}

function getConnectionStatus() {
    return connection.getStatus();
}

function readFile(filePath, encoding = 'utf8') {
    return fs.promises.readFile(filePath, encoding);
}

function writeFile(filePath, data, encoding = 'utf8') {
    return fs.promises.writeFile(filePath, data, encoding);
}

async function saveGeneralSettings(ip, username, password, connectionType) {
    const type = normalizeConnectionType(connectionType);
    const host = String(ip ?? '').trim();
    const problem = validateSettings({ host: host || 'localhost', username, password });
    if (problem) {
        throw new Error(problem);
    }

    const filePath = settingsPath();
    let settingsData = await readFile(filePath, 'utf8');
    const fields = { connectionType: type, ipAddress: host, userName: username, password: password };
    for (const [key, value] of Object.entries(fields)) {
        const safeValue = String(value ?? '').replace(/[;\r\n]/g, '');
        const regex = new RegExp(`\\$${key},([^;]*);`);
        const line = `$${key},${safeValue};`;
        if (regex.test(settingsData)) {
            settingsData = settingsData.replace(regex, line);
        } else {
            settingsData += `\n${line}`;
        }
    }
    await writeFile(filePath, settingsData, 'utf8');
    return connectFromSettings();
}

async function saveFloorSettings(numFloors, floorNames) {
    const filePath = settingsPath();
    let settingsData = await readFile(filePath, 'utf8');
    const floorCount = Number(numFloors);
    if (!Number.isInteger(floorCount) || floorCount < 1 || floorCount > 6) {
        throw new Error('Number of floors must be from 1 to 6');
    }

    if (/\$Floornumber,\d+;/.test(settingsData)) {
        settingsData = settingsData.replace(/\$Floornumber,\d+;/, `$Floornumber,${floorCount};`);
    } else {
        settingsData += `\n$Floornumber,${floorCount};`;
    }

    floorNames.slice(0, floorCount).forEach((name, index) => {
        const safeName = String(name || `Floor ${index + 1}`).replace(/[;\r\n]/g, '').trim() || `Floor ${index + 1}`;
        const regex = new RegExp(`\\$Floorinfo${index + 1},([^;]*);`);
        const line = `$Floorinfo${index + 1},${safeName};`;
        if (regex.test(settingsData)) {
            settingsData = settingsData.replace(regex, line);
        } else {
            settingsData += `\n${line}`;
        }
    });

    await writeFile(filePath, settingsData, 'utf8');
}

function formatLightLine(light) {
    const id = Number(light.id);
    const floor = Number(light.floor);
    const x = Number(light.x);
    const y = Number(light.y);
    if (!Number.isInteger(id) || id < 1) {
        throw new Error('Light id must be a positive number');
    }
    if (!Number.isInteger(floor) || floor < 1 || floor > 6) {
        throw new Error('Light floor must be from 1 to 6');
    }
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
        throw new Error('Light position is not a number');
    }

    const clean = (value, fallback) => String(value ?? fallback).replace(/[;,\r\n]/g, '').trim() || fallback;
    const name = clean(light.name, 'New Light');
    const module = clean(light.module, '0');
    const channel = clean(light.channel, '0');
    const deviceId = clean(light.deviceId, '0');

    return `$Lightsetting;${id};floor,${floor},${x.toFixed(4)}%,${y.toFixed(4)}%,${name},${module},${channel},${deviceId};`;
}

async function saveLight(light) {
    const filePath = settingsPath();
    let settingsData = await readFile(filePath, 'utf8');
    const line = formatLightLine(light);
    const regex = new RegExp(`\\$Lightsetting;${Number(light.id)};floor,[^;]*;`);

    if (regex.test(settingsData)) {
        settingsData = settingsData.replace(regex, line);
    } else {
        if (!settingsData.endsWith('\n')) {
            settingsData += '\n';
        }
        settingsData += `${line}\n`;
    }

    await writeFile(filePath, settingsData, 'utf8');
}

function formatSceneLine(button) {
    const id = Number(button.id);
    const floor = Number(button.floor);
    const x = Number(button.x);
    const y = Number(button.y);
    if (!Number.isInteger(id) || id < 1) {
        throw new Error('Scene button id must be a positive number');
    }
    if (!Number.isInteger(floor) || floor < 1 || floor > 6) {
        throw new Error('Scene button floor must be from 1 to 6');
    }
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
        throw new Error('Scene button position is not a number');
    }

    const clean = (value, fallback) => String(value ?? fallback).replace(/[;,\r\n]/g, '').trim() || fallback;
    const name = clean(button.name, 'New Scene');
    const scene = clean(button.scene, '0');
    if (!/^\d+$/.test(scene)) {
        throw new Error('Scene number must be a whole number');
    }

    return `$Scenebutton;${id};floor,${floor},${x.toFixed(4)}%,${y.toFixed(4)}%,${name},${scene};`;
}

async function saveSceneButton(button) {
    const filePath = settingsPath();
    let settingsData = await readFile(filePath, 'utf8');
    const line = formatSceneLine(button);
    const regex = new RegExp(`\\$Scenebutton;${Number(button.id)};floor,[^;]*;`);

    if (regex.test(settingsData)) {
        settingsData = settingsData.replace(regex, line);
    } else {
        if (!settingsData.endsWith('\n')) {
            settingsData += '\n';
        }
        settingsData += `${line}\n`;
    }

    await writeFile(filePath, settingsData, 'utf8');
}

function formatPageLine(button) {
    const id = Number(button.id);
    const floor = Number(button.floor);
    const x = Number(button.x);
    const y = Number(button.y);
    if (!Number.isInteger(id) || id < 1) {
        throw new Error('Page button id must be a positive number');
    }
    if (!Number.isInteger(floor) || floor < 1 || floor > 6) {
        throw new Error('Page button floor must be from 1 to 6');
    }
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
        throw new Error('Page button position is not a number');
    }

    const name = String(button.name ?? 'New Page').replace(/[;,\r\n]/g, '').trim() || 'New Page';
    const target = String(button.target ?? '0').trim();
    if (!/^\d+$/.test(target) || Number(target) > 6) {
        throw new Error('Page button target must be a page number from 1 to 6, or 0 for none');
    }

    return `$Pagebutton;${id};floor,${floor},${x.toFixed(4)}%,${y.toFixed(4)}%,${name},${Number(target)};`;
}

async function savePageButton(button) {
    const filePath = settingsPath();
    let settingsData = await readFile(filePath, 'utf8');
    const line = formatPageLine(button);
    const regex = new RegExp(`\\$Pagebutton;${Number(button.id)};floor,[^;]*;`);

    if (regex.test(settingsData)) {
        settingsData = settingsData.replace(regex, line);
    } else {
        if (!settingsData.endsWith('\n')) {
            settingsData += '\n';
        }
        settingsData += `${line}\n`;
    }

    await writeFile(filePath, settingsData, 'utf8');
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
    setGatewayMessageHandler,
    setConnectionStatusHandler,
    settingsPath,
    ensureSettingsFile,
    parseGeneralSettings,
    connectFromSettings,
    getConnectionStatus,
    sendCommand,
    readFile,
    saveFloorSettings,
    saveGeneralSettings,
    saveLight,
    formatSceneLine,
    saveSceneButton,
    formatPageLine,
    savePageButton,
    copyFloorImage,
};

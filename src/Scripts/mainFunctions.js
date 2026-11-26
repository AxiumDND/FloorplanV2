const net = require('net');
const fs = require('fs');
const path = require('path');

const TCP_PORT = 26;

let dataDir = null;
let client = null;
let ipAddress = '';
let onTcpMessage = () => {};

function setDataDir(dir) {
    dataDir = dir;
}

function setTcpMessageHandler(handler) {
    onTcpMessage = handler;
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

function setupTcpClient() {
    if (!ipAddress) {
        return;
    }

    client = new net.Socket();
    client.connect(TCP_PORT, ipAddress, () => {
        console.info(`Connected to the lighting system at ${ipAddress}:${TCP_PORT}`);
    });

    client.on('data', (data) => {
        const message = data.toString();
        console.info(`Received: ${message}`);
        onTcpMessage(message);
    });

    client.on('close', () => {
        console.info('Connection to lighting system closed');
    });

    client.on('error', (err) => {
        console.error(`TCP client error: ${err.message}`);
    });
}

function setIpAddress(ip) {
    ipAddress = (ip || '').trim();
    if (client) {
        client.destroy();
        client = null;
    }
    if (ipAddress) {
        setupTcpClient();
    }
}

function sendTcpCommand(command) {
    if (!client || !client.writable) {
        return false;
    }
    client.write(command);
    return true;
}

function readFile(filePath, encoding = 'utf8') {
    return fs.promises.readFile(filePath, encoding);
}

function writeFile(filePath, data, encoding = 'utf8') {
    return fs.promises.writeFile(filePath, data, encoding);
}

async function saveGeneralSettings(ip, username, password) {
    const filePath = settingsPath();
    let settingsData = await readFile(filePath, 'utf8');
    const fields = { ipAddress: ip, userName: username, password: password };
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
    setTcpMessageHandler,
    settingsPath,
    ensureSettingsFile,
    setIpAddress,
    sendTcpCommand,
    readFile,
    saveFloorSettings,
    saveGeneralSettings,
    saveLight,
    copyFloorImage,
};

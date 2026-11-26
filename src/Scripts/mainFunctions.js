const net = require('net');
const fs = require('fs');
const path = require('path');

// TCP Client functions
let client;
let ipAddress;

function setupTcpClient() {
    if (!ipAddress) {
        console.error('IP address is not set.');
        return;
    }

    client = new net.Socket();
    client.connect(26, ipAddress, () => {
        console.info('Connected to the lighting system');
    });

    client.on('data', (data) => {
        console.info(`Received: ${data}`);
        if (global.mainWindow && global.mainWindow.webContents) {
            global.mainWindow.webContents.send('tcp-receive', data.toString());
        } else {
            console.error('mainWindow is not defined');
        }
    });

    client.on('close', () => {
        console.info('Connection to lighting system closed');
    });

    client.on('error', (err) => {
        console.error(`TCP Client Error: ${err.message}`);
    });
}

function setIpAddress(ip) {
    ipAddress = ip;
    if (client) {
        client.destroy();
    }
    setupTcpClient();
}

function sendTcpCommand(command) {
    if (client && client.writable) {
        client.write(command);
        console.info(`Sent command: ${command}`);
    } else {
        console.error('TCP client is not connected');
    }
}

// File system functions
function readFile(filePath, encoding = 'utf8') {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, encoding, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

function writeFile(filePath, data, encoding = 'utf8') {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, data, encoding, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

async function saveGeneralSettings(filePath, ip, username, password) {
    let settingsData = await readFile(filePath, 'utf8');
    const fields = { ipAddress: ip, userName: username, password: password };
    for (const [key, value] of Object.entries(fields)) {
        const regex = new RegExp(`\\$${key},([^;]*);`);
        if (settingsData.match(regex)) {
            settingsData = settingsData.replace(regex, `$${key},${value};`);
        } else {
            settingsData += `\n$${key},${value};`;
        }
    }
    await writeFile(filePath, settingsData, 'utf8');
}

async function saveSettingsToFile(filePath, numFloors, floorNames) {
    let settingsData = await readFile(filePath, 'utf8');
    
    settingsData = settingsData.replace(/\$Floornumber,\d+;/, `$Floornumber,${numFloors};`);
    floorNames.forEach((name, index) => {
        const regex = new RegExp(`\\$Floorinfo${index + 1},([^;]+);`);
        if (settingsData.match(regex)) {
            settingsData = settingsData.replace(regex, `$Floorinfo${index + 1},${name};`);
        } else {
            settingsData += `\n$Floorinfo${index + 1},${name};`;
        }
    });

    await writeFile(filePath, settingsData, 'utf8');
}

async function updateLightPosition(lightId, newX, newY) {
    try {
        let settingsData = await readFile('userData/settings.csv', 'utf8');

        const regex = new RegExp(`\\$Lightsetting;${lightId};floor,(\\d+),([\\d.]+)%,([\\d.]+)%,([^,]+),([^,]+),([^,]+),([^,]+);`);
        settingsData = settingsData.replace(regex, (match, floor, oldX, oldY, name, module, channel, deviceId) => {
            return `$Lightsetting;${lightId};floor,${floor},${newX}%,${newY}%,${name},${module},${channel},${deviceId};`;
        });

        await writeFile('userData/settings.csv', settingsData, 'utf8');
        console.info(`Light position updated in settings.csv for light ID ${lightId}`);
    } catch (err) {
        console.error(`Failed to update light position: ${err.message}`);
    }
}

module.exports = {
    setupTcpClient,
    setIpAddress,
    sendTcpCommand,
    readFile,
    writeFile,
    saveSettingsToFile,
    saveGeneralSettings,
    updateLightPosition
};
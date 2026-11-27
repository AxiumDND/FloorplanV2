// The main process owns settings.json and sends the renderer a view of it. The view never holds
// the password, only whether one is saved.

const MAX_FLOORS = 6;

function position(value) {
    return `${Number(value).toFixed(4)}%`;
}

export function loadLightData(settings) {
    return ((settings && settings.lights) || []).map((light) => ({
        id: light.id,
        floor: light.floor,
        left: position(light.x),
        top: position(light.y),
        name: light.name,
        module: light.module,
        channel: light.channel,
        deviceId: light.deviceId,
        isOn: false,
        level: 100,
    }));
}

export function loadSceneButtonData(settings) {
    return ((settings && settings.scenes) || []).map((button) => ({
        id: button.id,
        floor: button.floor,
        left: position(button.x),
        top: position(button.y),
        name: button.name,
        scene: button.scene,
    }));
}

export function loadPageButtonData(settings) {
    return ((settings && settings.pages) || []).map((button) => ({
        id: button.id,
        floor: button.floor,
        left: position(button.x),
        top: position(button.y),
        name: button.name,
        target: button.target,
    }));
}

export function parseFloorsFromSettings(settings) {
    const count = Number(settings && settings.floors && settings.floors.count);
    return Number.isInteger(count) && count >= 1 && count <= MAX_FLOORS ? count : 1;
}

export function parseFloorNamesFromSettings(settings, numFloors) {
    const names = (settings && settings.floors && settings.floors.names) || [];
    const floorNames = [];
    for (let i = 1; i <= numFloors; i++) {
        floorNames.push(names[i - 1] || `Floor ${i}`);
    }
    return floorNames;
}

export function parseAdditionalSettings(settings) {
    const connection = (settings && settings.connection) || {};
    const secureStorage = (settings && settings.secureStorage) || { available: false, message: '' };
    return {
        ipAddress: connection.host || '',
        userName: connection.username || '',
        hasPassword: connection.hasPassword === true,
        connectionType: connection.type === 'tcp' ? 'tcp' : 'http',
        secureStorage,
    };
}

export function populateSettingsForm(settings) {
    const { ipAddress, userName, hasPassword, connectionType, secureStorage } = parseAdditionalSettings(settings);
    const numFloors = parseFloorsFromSettings(settings);

    const ipInput = document.getElementById('ip-address');
    const typeSelect = document.getElementById('connection-type');
    const userInput = document.getElementById('username');
    const passInput = document.getElementById('password');
    const clearPassword = document.getElementById('clear-password');
    const note = document.getElementById('password-storage-note');
    const numFloorsSelect = document.getElementById('number-of-Floors');

    if (typeSelect) typeSelect.value = connectionType;
    if (ipInput) ipInput.value = ipAddress;
    if (userInput) userInput.value = userName;
    if (passInput) {
        passInput.value = '';
        passInput.disabled = !secureStorage.available;
        passInput.placeholder = hasPassword ? 'Saved - leave blank to keep' : '';
    }
    if (clearPassword) {
        clearPassword.checked = false;
        clearPassword.disabled = !hasPassword;
    }
    if (note) {
        note.textContent = secureStorage.available ? '' : secureStorage.message;
        note.hidden = secureStorage.available;
    }
    if (numFloorsSelect) numFloorsSelect.value = String(numFloors);

    return { ipAddress, userName, hasPassword, connectionType, numFloors, secureStorage };
}

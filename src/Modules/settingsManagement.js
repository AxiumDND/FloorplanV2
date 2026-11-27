export function loadLightData(settingsData) {
    const lightData = [];
    const lightRegex = /\$Lightsetting;(\d+);floor,(\d+),([\d.]+)%,([\d.]+)%,([^,]+),(\d+),(\d+),(\d+);/g;

    let match;
    while ((match = lightRegex.exec(settingsData)) !== null) {
        lightData.push({
            id: parseInt(match[1]),
            floor: parseInt(match[2]),
            left: match[3] + '%',
            top: match[4] + '%',
            name: match[5],
            module: match[6],
            channel: match[7],
            deviceId: match[8],
            isOn: false,
            level: 100
        });
    }
    return lightData;
}

export function parseFloorsFromSettings(settingsData) {
    const match = settingsData.match(/\$Floornumber,(\d+);/);
    return match ? parseInt(match[1], 10) : 1;
}

export function parseFloorNamesFromSettings(settingsData, numFloors) {
    const floorNames = [];
    for (let i = 1; i <= numFloors; i++) {
        const regex = new RegExp(`\\$Floorinfo${i},([^;]+);`);
        const match = settingsData.match(regex);
        floorNames.push(match ? match[1] : `Floor ${i}`);
    }
    return floorNames;
}

export function parseAdditionalSettings(settingsData) {
    const ipAddressMatch = settingsData.match(/\$ipAddress,([^;]*);/);
    const userNameMatch = settingsData.match(/\$userName,([^;]*);/);
    const passwordMatch = settingsData.match(/\$password,([^;]*);/);
    const connectionTypeMatch = settingsData.match(/\$connectionType,([^;]*);/);

    return {
        ipAddress: ipAddressMatch ? ipAddressMatch[1] : '',
        userName: userNameMatch ? userNameMatch[1] : '',
        password: passwordMatch ? passwordMatch[1] : '',
        connectionType: connectionTypeMatch && connectionTypeMatch[1].trim().toLowerCase() === 'tcp' ? 'tcp' : 'http',
    };
}

export function populateSettingsForm(settingsData) {
    const { ipAddress, userName, password, connectionType } = parseAdditionalSettings(settingsData);
    const numFloors = parseFloorsFromSettings(settingsData);

    const ipInput = document.getElementById('ip-address');
    const typeSelect = document.getElementById('connection-type');
    const userInput = document.getElementById('username');
    const passInput = document.getElementById('password');
    const numFloorsSelect = document.getElementById('number-of-Floors');

    if (typeSelect) typeSelect.value = connectionType;
    if (ipInput) ipInput.value = ipAddress;
    if (userInput) userInput.value = userName;
    if (passInput) passInput.value = password;
    if (numFloorsSelect) numFloorsSelect.value = String(numFloors);

    return { ipAddress, userName, password, connectionType, numFloors };
}

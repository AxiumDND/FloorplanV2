// Reader for the old `$Key,value;` settings.csv, used only to migrate it to settings.json.

const MAX_FLOORS = 6;

function readValue(text, key) {
    const match = text.match(new RegExp(`\\$${key},([^;]*);`));
    return match ? match[1] : '';
}

function percent(value) {
    return Math.round(parseFloat(value) * 10000) / 10000;
}

function parseLegacySettings(text) {
    const source = String(text || '');

    const lights = [];
    const lightRegex = /\$Lightsetting;(\d+);floor,(\d+),([\d.]+)%,([\d.]+)%,([^,]+),(\d+),(\d+),(\d+);/g;
    let match;
    while ((match = lightRegex.exec(source)) !== null) {
        lights.push({
            id: parseInt(match[1], 10),
            floor: parseInt(match[2], 10),
            x: percent(match[3]),
            y: percent(match[4]),
            name: match[5],
            module: match[6],
            channel: match[7],
            deviceId: match[8],
        });
    }

    const scenes = [];
    const sceneRegex = /\$Scenebutton;(\d+);floor,(\d+),([\d.]+)%,([\d.]+)%,([^,;]+),(\d+);/g;
    while ((match = sceneRegex.exec(source)) !== null) {
        scenes.push({
            id: parseInt(match[1], 10),
            floor: parseInt(match[2], 10),
            x: percent(match[3]),
            y: percent(match[4]),
            name: match[5],
            scene: match[6],
        });
    }

    const pages = [];
    const pageRegex = /\$Pagebutton;(\d+);floor,(\d+),([\d.]+)%,([\d.]+)%,([^,;]+),(\d+);/g;
    while ((match = pageRegex.exec(source)) !== null) {
        pages.push({
            id: parseInt(match[1], 10),
            floor: parseInt(match[2], 10),
            x: percent(match[3]),
            y: percent(match[4]),
            name: match[5],
            target: match[6],
        });
    }

    const floorCountMatch = source.match(/\$Floornumber,(\d+);/);
    const floorCount = floorCountMatch ? parseInt(floorCountMatch[1], 10) : 1;
    const floorNames = [];
    for (let i = 1; i <= MAX_FLOORS; i++) {
        floorNames.push(readValue(source, `Floorinfo${i}`).trim() || `Floor ${i}`);
    }

    return {
        connection: {
            type: readValue(source, 'connectionType').trim().toLowerCase() === 'tcp' ? 'tcp' : 'http',
            host: readValue(source, 'ipAddress').trim(),
            username: readValue(source, 'userName'),
        },
        password: readValue(source, 'password'),
        floors: { count: floorCount, names: floorNames },
        lights,
        scenes,
        pages,
    };
}

function scrubLegacyPassword(text) {
    return String(text).replace(/\$password,[^;]*;/g, () => '$password,;');
}

function legacyHasPassword(text) {
    return readValue(String(text || ''), 'password') !== '';
}

module.exports = {
    parseLegacySettings,
    scrubLegacyPassword,
    legacyHasPassword,
};

const fs = require('fs');
const path = require('path');

const { normalizeConnectionType, validateSettings } = require('./gatewayConnection');
const { parseLegacySettings, scrubLegacyPassword, legacyHasPassword } = require('./legacySettings');

const SETTINGS_FILE = 'settings.json';
const LEGACY_FILE = 'settings.csv';
const LEGACY_RETIRED_FILE = 'settings.csv.migrated';
const SCHEMA_VERSION = 1;
const MAX_FLOORS = 6;
const MAX_TEXT = 100;

const SECRET_ERROR = 'SETTINGS_SECRET';

function secretError(message) {
    const error = new Error(message);
    error.code = SECRET_ERROR;
    return error;
}

// Write to a temp file in the same folder, flush it, then rename over the target so a crash
// leaves either the old file or the new one, never a partial file.
function writeFileAtomic(filePath, data) {
    const tempPath = `${filePath}.${process.pid}.tmp`;
    let fd = null;
    try {
        fd = fs.openSync(tempPath, 'w', 0o600);
        fs.writeFileSync(fd, data, 'utf8');
        fs.fsyncSync(fd);
        fs.closeSync(fd);
        fd = null;
        fs.renameSync(tempPath, filePath);
    } catch (error) {
        if (fd !== null) {
            try {
                fs.closeSync(fd);
            } catch {
                // already closing after a failed write
            }
        }
        try {
            fs.unlinkSync(tempPath);
        } catch {
            // temp file was never created
        }
        throw error;
    }
}

function cleanText(value, fallback) {
    const text = String(value ?? '')
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .trim()
        .slice(0, MAX_TEXT);
    return text || fallback;
}

function checkRecord(label, record) {
    const id = Number(record.id);
    const floor = Number(record.floor);
    const x = Number(record.x);
    const y = Number(record.y);
    if (!Number.isInteger(id) || id < 1) {
        throw new Error(`${label} id must be a positive number`);
    }
    if (!Number.isInteger(floor) || floor < 1 || floor > MAX_FLOORS) {
        throw new Error(`${label} floor must be from 1 to 6`);
    }
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
        throw new Error(`${label} position is not a number`);
    }
    return { id, floor, x: Math.round(x * 10000) / 10000, y: Math.round(y * 10000) / 10000 };
}

function normalizeLight(light) {
    return {
        ...checkRecord('Light', light),
        name: cleanText(light.name, 'New Light'),
        module: cleanText(light.module, '0'),
        channel: cleanText(light.channel, '0'),
        deviceId: cleanText(light.deviceId, '0'),
    };
}

function normalizeScene(button) {
    const base = checkRecord('Scene button', button);
    const scene = cleanText(button.scene, '0');
    if (!/^\d+$/.test(scene)) {
        throw new Error('Scene number must be a whole number');
    }
    return { ...base, name: cleanText(button.name, 'New Scene'), scene };
}

function normalizePage(button) {
    const base = checkRecord('Page button', button);
    const target = String(button.target ?? '0').trim();
    if (!/^\d+$/.test(target) || Number(target) > MAX_FLOORS) {
        throw new Error('Page button target must be a page number from 1 to 6, or 0 for none');
    }
    return { ...base, name: cleanText(button.name, 'New Page'), target: String(Number(target)) };
}

function upsert(list, record) {
    const index = list.findIndex((item) => item.id === record.id);
    if (index >= 0) {
        list[index] = record;
    } else {
        list.push(record);
    }
}

function lenientList(raw, normalize) {
    if (!Array.isArray(raw)) {
        return [];
    }
    const out = [];
    for (const item of raw) {
        try {
            upsert(out, normalize(item || {}));
        } catch {
            // skip a record that is not usable instead of refusing to start
        }
    }
    return out;
}

function defaultFloorNames() {
    return Array.from({ length: MAX_FLOORS }, (_, index) => `Floor ${index + 1}`);
}

function normalizeFloors(raw) {
    const count = Number(raw && raw.count);
    const names = defaultFloorNames();
    if (raw && Array.isArray(raw.names)) {
        raw.names.slice(0, MAX_FLOORS).forEach((name, index) => {
            names[index] = cleanText(name, `Floor ${index + 1}`);
        });
    }
    return { count: Number.isInteger(count) && count >= 1 && count <= MAX_FLOORS ? count : 1, names };
}

function defaultState() {
    return {
        version: SCHEMA_VERSION,
        connection: { type: 'http', host: '', username: '', password: null },
        legacyPasswordPending: false,
        floors: { count: 1, names: defaultFloorNames() },
        lights: [
            { id: 1, floor: 1, x: 50, y: 50, name: 'Example light', module: '001', channel: '001', deviceId: '001' },
        ],
        scenes: [],
        pages: [],
    };
}

function normalizeState(raw) {
    const connection = (raw && raw.connection) || {};
    const password = connection.password && typeof connection.password.encrypted === 'string'
        ? { encrypted: connection.password.encrypted }
        : null;
    return {
        version: SCHEMA_VERSION,
        connection: {
            type: normalizeConnectionType(connection.type),
            host: String(connection.host || '').trim(),
            username: String(connection.username || ''),
            password,
        },
        legacyPasswordPending: raw && raw.legacyPasswordPending === true,
        floors: normalizeFloors(raw && raw.floors),
        lights: lenientList(raw && raw.lights, normalizeLight),
        scenes: lenientList(raw && raw.scenes, normalizeScene),
        pages: lenientList(raw && raw.pages, normalizePage),
    };
}

// `secrets` is { isAvailable(), unavailableReason(), encrypt(text) -> Buffer, decrypt(Buffer) -> text }.
function createSettingsStore({ dir, secrets }) {
    const settingsPath = path.join(dir, SETTINGS_FILE);
    const legacyPath = path.join(dir, LEGACY_FILE);
    const legacyRetiredPath = path.join(dir, LEGACY_RETIRED_FILE);
    let state = null;

    function secureStorageStatus() {
        const available = secrets.isAvailable();
        return {
            available,
            message: available
                ? ''
                : secrets.unavailableReason() ||
                  'Secure password storage (Electron safeStorage) is not available on this system, so a password cannot be saved. Connect without a password or enable the operating system keyring.',
        };
    }

    function encryptPassword(plain) {
        if (!secrets.isAvailable()) {
            throw secretError(secureStorageStatus().message);
        }
        return { encrypted: secrets.encrypt(plain).toString('base64') };
    }

    function commit(next) {
        fs.mkdirSync(dir, { recursive: true });
        writeFileAtomic(settingsPath, `${JSON.stringify(next, null, 2)}\n`);
        state = next;
    }

    // Blank the password in the old file first (atomically), then set the file aside as a backup.
    function retireLegacyFile() {
        if (!fs.existsSync(legacyPath)) {
            return;
        }
        const text = fs.readFileSync(legacyPath, 'utf8');
        writeFileAtomic(legacyPath, scrubLegacyPassword(text));
        fs.renameSync(legacyPath, legacyRetiredPath);
    }

    function migrateLegacyFile() {
        const text = fs.readFileSync(legacyPath, 'utf8');
        const legacy = parseLegacySettings(text);
        const next = normalizeState({
            connection: legacy.connection,
            floors: legacy.floors,
            lights: legacy.lights,
            scenes: legacy.scenes,
            pages: legacy.pages,
        });

        if (legacy.password) {
            try {
                next.connection.password = encryptPassword(legacy.password);
            } catch {
                next.legacyPasswordPending = true;
            }
        }
        commit(next);
        if (!next.legacyPasswordPending) {
            retireLegacyFile();
        }
    }

    // The old file could not be emptied of its password last time (no secure storage). Try again.
    function finishPasswordMigration() {
        if (!fs.existsSync(legacyPath) || !legacyHasPassword(fs.readFileSync(legacyPath, 'utf8'))) {
            commit({ ...state, legacyPasswordPending: false });
            retireLegacyFile();
            return;
        }
        if (!secrets.isAvailable()) {
            return;
        }
        const legacy = parseLegacySettings(fs.readFileSync(legacyPath, 'utf8'));
        const password = encryptPassword(legacy.password);
        commit({ ...state, legacyPasswordPending: false, connection: { ...state.connection, password } });
        retireLegacyFile();
    }

    function load() {
        if (fs.existsSync(settingsPath)) {
            let raw;
            try {
                raw = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            } catch (error) {
                throw new Error(`${SETTINGS_FILE} could not be read (${error.message}). It was left unchanged.`);
            }
            state = normalizeState(raw);
            if (state.legacyPasswordPending) {
                finishPasswordMigration();
            } else {
                retireLegacyFile();
            }
        } else if (fs.existsSync(legacyPath)) {
            migrateLegacyFile();
        } else {
            commit(defaultState());
        }
        return view();
    }

    function view() {
        const { connection, floors } = state;
        return {
            connection: {
                type: connection.type,
                host: connection.host,
                username: connection.username,
                hasPassword: connection.password !== null || state.legacyPasswordPending,
            },
            secureStorage: secureStorageStatus(),
            floors: { count: floors.count, names: floors.names.slice(0, floors.count) },
            lights: state.lights.map((item) => ({ ...item })),
            scenes: state.scenes.map((item) => ({ ...item })),
            pages: state.pages.map((item) => ({ ...item })),
        };
    }

    function getConnectionSettings() {
        const { connection } = state;
        const settings = { type: connection.type, host: connection.host, username: connection.username, password: '' };
        if (!connection.username) {
            return settings;
        }
        if (state.legacyPasswordPending) {
            throw secretError(
                `${secureStorageStatus().message} The password from the old settings file has not been moved to secure storage yet.`
            );
        }
        if (connection.password) {
            if (!secrets.isAvailable()) {
                throw secretError(secureStorageStatus().message);
            }
            try {
                settings.password = secrets.decrypt(Buffer.from(connection.password.encrypted, 'base64'));
            } catch {
                throw secretError('The saved password could not be decrypted on this system. Enter it again in Settings.');
            }
        }
        return settings;
    }

    function saveGeneral(ip, username, password, connectionType, clearPassword) {
        const type = normalizeConnectionType(connectionType);
        const host = String(ip ?? '').trim();
        const user = String(username ?? '');
        const newPassword = String(password ?? '');
        const problem = validateSettings({ host: host || 'localhost', username: user, password: newPassword });
        if (problem) {
            throw new Error(problem);
        }

        const previous = state.connection;
        let nextPassword = previous.password;
        let pending = state.legacyPasswordPending;
        if (newPassword) {
            nextPassword = encryptPassword(newPassword);
            pending = false;
        } else if (clearPassword === true || !user || user !== previous.username) {
            nextPassword = null;
            pending = false;
        }

        commit({ ...state, legacyPasswordPending: pending, connection: { type, host, username: user, password: nextPassword } });
        if (!pending) {
            retireLegacyFile();
        }
        return view();
    }

    function saveFloors(numFloors, floorNames) {
        const count = Number(numFloors);
        if (!Number.isInteger(count) || count < 1 || count > MAX_FLOORS) {
            throw new Error('Number of floors must be from 1 to 6');
        }
        const names = state.floors.names.slice();
        (Array.isArray(floorNames) ? floorNames : []).slice(0, count).forEach((name, index) => {
            names[index] = cleanText(name, `Floor ${index + 1}`);
        });
        commit({ ...state, floors: { count, names } });
    }

    function saveList(key, record) {
        const list = state[key].slice();
        upsert(list, record);
        commit({ ...state, [key]: list });
    }

    return {
        load,
        view,
        getConnectionSettings,
        saveGeneral,
        saveFloors,
        saveLight: (light) => saveList('lights', normalizeLight(light)),
        saveScene: (button) => saveList('scenes', normalizeScene(button)),
        savePage: (button) => saveList('pages', normalizePage(button)),
        settingsPath,
    };
}

module.exports = {
    SECRET_ERROR,
    SETTINGS_FILE,
    LEGACY_FILE,
    LEGACY_RETIRED_FILE,
    createSettingsStore,
    writeFileAtomic,
    normalizeLight,
    normalizeScene,
    normalizePage,
};

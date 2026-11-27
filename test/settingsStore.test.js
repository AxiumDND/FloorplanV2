const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { createSettingsStore, SECRET_ERROR } = require('../src/Scripts/settingsStore');
const { createElectronSecrets } = require('../src/Scripts/electronSecrets');
const main = require('../src/Scripts/mainFunctions');

const LEGACY = [
    '[General Settings];',
    '$connectionType,tcp;',
    '$ipAddress,10.0.0.5;',
    '$userName,admin;',
    '$password,hunter2;',
    '$Floornumber,2;',
    '$Floorinfo1,Ground;',
    '$Floorinfo2,Upstairs;',
    '$Lightsetting;1;floor,1,50.0000%,50.0000%,Lamp,001,002,003;',
    '$Lightsetting;2;floor,2,12.5000%,80.0000%,Hall,004,005,006;',
    '$Scenebutton;1;floor,1,20.0000%,10.0000%,Evening,12;',
    '$Pagebutton;1;floor,1,10.5000%,90.0000%,Upstairs,2;',
    '',
].join('\n');

function fakeSecrets({ available = true } = {}) {
    return {
        available,
        isAvailable() {
            return this.available;
        },
        unavailableReason: () => '',
        encrypt: (text) => Buffer.from(`enc:${text.split('').reverse().join('')}`),
        decrypt: (buffer) => {
            const raw = buffer.toString();
            if (!raw.startsWith('enc:')) {
                throw new Error('bad ciphertext');
            }
            return raw.slice(4).split('').reverse().join('');
        },
    };
}

function withDir(fn) {
    return async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'floorplan-'));
        try {
            await fn(dir);
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    };
}

const readJson = (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'));
const allFiles = (dir) => fs.readdirSync(dir).sort();

test('a first launch writes a default settings.json', withDir((dir) => {
    const view = createSettingsStore({ dir, secrets: fakeSecrets() }).load();
    assert.strictEqual(view.floors.count, 1);
    assert.strictEqual(view.lights.length, 1);
    assert.deepStrictEqual(allFiles(dir), ['settings.json']);
    assert.strictEqual(readJson(dir).version, 1);
}));

test('writes go through a temp file and leave no temp files behind', withDir((dir) => {
    const store = createSettingsStore({ dir, secrets: fakeSecrets() });
    store.load();
    const renames = [];
    const original = fs.renameSync;
    fs.renameSync = (from, to) => {
        renames.push([path.basename(from), path.basename(to)]);
        return original(from, to);
    };
    try {
        store.saveLight({ id: 5, floor: 1, x: 1, y: 2, name: 'New', module: '1', channel: '2', deviceId: '3' });
    } finally {
        fs.renameSync = original;
    }
    assert.strictEqual(renames.length, 1);
    assert.match(renames[0][0], /^settings\.json\..*\.tmp$/);
    assert.strictEqual(renames[0][1], 'settings.json');
    assert.deepStrictEqual(allFiles(dir), ['settings.json']);
}));

test('a failed write keeps the previous file and the in-memory settings', withDir((dir) => {
    const store = createSettingsStore({ dir, secrets: fakeSecrets() });
    store.load();
    const before = fs.readFileSync(path.join(dir, 'settings.json'), 'utf8');
    const original = fs.renameSync;
    fs.renameSync = () => {
        throw new Error('disk full');
    };
    try {
        assert.throws(() => store.saveFloors(3, ['A', 'B', 'C']), /disk full/);
    } finally {
        fs.renameSync = original;
    }
    assert.strictEqual(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'), before);
    assert.strictEqual(store.view().floors.count, 1);
    assert.deepStrictEqual(allFiles(dir), ['settings.json']);
}));

test('a corrupt settings.json is reported and never overwritten', withDir((dir) => {
    fs.writeFileSync(path.join(dir, 'settings.json'), '{ not json');
    assert.throws(() => createSettingsStore({ dir, secrets: fakeSecrets() }).load(), /could not be read/);
    assert.strictEqual(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'), '{ not json');
}));

test('migration keeps floors, lights, scene buttons and page buttons and moves the password', withDir((dir) => {
    fs.writeFileSync(path.join(dir, 'settings.csv'), LEGACY);
    const secrets = fakeSecrets();
    const store = createSettingsStore({ dir, secrets });
    const view = store.load();

    assert.deepStrictEqual(view.floors, { count: 2, names: ['Ground', 'Upstairs'] });
    assert.deepStrictEqual(view.lights, [
        { id: 1, floor: 1, x: 50, y: 50, name: 'Lamp', module: '001', channel: '002', deviceId: '003' },
        { id: 2, floor: 2, x: 12.5, y: 80, name: 'Hall', module: '004', channel: '005', deviceId: '006' },
    ]);
    assert.deepStrictEqual(view.scenes, [{ id: 1, floor: 1, x: 20, y: 10, name: 'Evening', scene: '12' }]);
    assert.deepStrictEqual(view.pages, [{ id: 1, floor: 1, x: 10.5, y: 90, name: 'Upstairs', target: '2' }]);
    assert.deepStrictEqual(view.connection, { type: 'tcp', host: '10.0.0.5', username: 'admin', hasPassword: true });

    assert.deepStrictEqual(store.getConnectionSettings(), {
        type: 'tcp',
        host: '10.0.0.5',
        username: 'admin',
        password: 'hunter2',
    });

    assert.deepStrictEqual(allFiles(dir), ['settings.csv.migrated', 'settings.json']);
    assert.ok(!fs.readFileSync(path.join(dir, 'settings.json'), 'utf8').includes('hunter2'));
    const retired = fs.readFileSync(path.join(dir, 'settings.csv.migrated'), 'utf8');
    assert.ok(!retired.includes('hunter2'));
    assert.ok(retired.includes('$Lightsetting;1;'));
}));

test('migration without safe storage keeps the password out of settings.json and says so', withDir((dir) => {
    fs.writeFileSync(path.join(dir, 'settings.csv'), LEGACY);
    const secrets = fakeSecrets({ available: false });
    const store = createSettingsStore({ dir, secrets });
    const view = store.load();

    assert.strictEqual(view.secureStorage.available, false);
    assert.ok(view.secureStorage.message.length > 0);
    assert.strictEqual(view.lights.length, 2);
    assert.ok(!fs.readFileSync(path.join(dir, 'settings.json'), 'utf8').includes('hunter2'));
    assert.throws(() => store.getConnectionSettings(), (error) => error.code === SECRET_ERROR);

    secrets.available = true;
    const later = createSettingsStore({ dir, secrets });
    later.load();
    assert.strictEqual(later.getConnectionSettings().password, 'hunter2');
    assert.deepStrictEqual(allFiles(dir), ['settings.csv.migrated', 'settings.json']);
    assert.ok(!fs.readFileSync(path.join(dir, 'settings.csv.migrated'), 'utf8').includes('hunter2'));
}));

test('a leftover old file is emptied of its password when settings.json already exists', withDir((dir) => {
    fs.writeFileSync(path.join(dir, 'settings.csv'), LEGACY);
    createSettingsStore({ dir, secrets: fakeSecrets() }).load();
    fs.writeFileSync(path.join(dir, 'settings.csv'), LEGACY);
    createSettingsStore({ dir, secrets: fakeSecrets() }).load();
    assert.ok(!fs.readFileSync(path.join(dir, 'settings.csv.migrated'), 'utf8').includes('hunter2'));
    assert.ok(!fs.existsSync(path.join(dir, 'settings.csv')));
}));

test('the password is stored encrypted and never returned to the renderer', withDir((dir) => {
    const store = createSettingsStore({ dir, secrets: fakeSecrets() });
    store.load();
    const view = store.saveGeneral('192.168.1.10', 'admin', 's3cret', 'http');
    assert.strictEqual(view.connection.hasPassword, true);
    assert.ok(!JSON.stringify(view).includes('s3cret'));

    const text = fs.readFileSync(path.join(dir, 'settings.json'), 'utf8');
    assert.ok(!text.includes('s3cret'));
    assert.ok(readJson(dir).connection.password.encrypted);
    assert.strictEqual(store.getConnectionSettings().password, 's3cret');
}));

test('a blank password keeps the saved one for the same user and a new user drops it', withDir((dir) => {
    const store = createSettingsStore({ dir, secrets: fakeSecrets() });
    store.load();
    store.saveGeneral('10.0.0.1', 'admin', 's3cret', 'http');
    store.saveGeneral('10.0.0.2', 'admin', '', 'tcp');
    assert.strictEqual(store.getConnectionSettings().password, 's3cret');

    store.saveGeneral('10.0.0.2', 'other', '', 'tcp');
    assert.strictEqual(store.getConnectionSettings().password, '');
    assert.strictEqual(readJson(dir).connection.password, null);

    store.saveGeneral('10.0.0.2', 'admin', 's3cret', 'tcp');
    store.saveGeneral('10.0.0.2', 'admin', '', 'tcp', true);
    assert.strictEqual(store.view().connection.hasPassword, false);
}));

test('without safe storage a password is refused and nothing is written', withDir((dir) => {
    const store = createSettingsStore({ dir, secrets: fakeSecrets({ available: false }) });
    store.load();
    const before = fs.readFileSync(path.join(dir, 'settings.json'), 'utf8');
    assert.throws(() => store.saveGeneral('10.0.0.1', 'admin', 's3cret', 'http'), (error) => error.code === SECRET_ERROR);
    assert.strictEqual(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'), before);
    assert.deepStrictEqual(allFiles(dir), ['settings.json']);

    store.saveGeneral('10.0.0.1', '', '', 'http');
    assert.strictEqual(store.view().connection.host, '10.0.0.1');
}));

test('a password that cannot be decrypted fails closed instead of connecting without it', withDir((dir) => {
    const store = createSettingsStore({ dir, secrets: fakeSecrets() });
    store.load();
    store.saveGeneral('10.0.0.1', 'admin', 's3cret', 'http');
    const settings = readJson(dir);
    settings.connection.password.encrypted = Buffer.from('garbage').toString('base64');
    fs.writeFileSync(path.join(dir, 'settings.json'), JSON.stringify(settings));

    const reloaded = createSettingsStore({ dir, secrets: fakeSecrets() });
    reloaded.load();
    assert.throws(() => reloaded.getConnectionSettings(), (error) => error.code === SECRET_ERROR);
}));

test('floor, light, scene and page changes persist', withDir((dir) => {
    const store = createSettingsStore({ dir, secrets: fakeSecrets() });
    store.load();
    store.saveFloors(3, ['One', '', 'Three']);
    store.saveLight({ id: 1, floor: 2, x: 10, y: 20, name: 'Moved', module: '9', channel: '8', deviceId: '7' });
    store.saveScene({ id: 1, floor: 1, x: 1, y: 2, name: 'S', scene: '4' });
    store.savePage({ id: 1, floor: 1, x: 3, y: 4, name: 'P', target: '2' });

    const reloaded = createSettingsStore({ dir, secrets: fakeSecrets() }).load();
    assert.deepStrictEqual(reloaded.floors, { count: 3, names: ['One', 'Floor 2', 'Three'] });
    assert.deepStrictEqual(reloaded.lights, [
        { id: 1, floor: 2, x: 10, y: 20, name: 'Moved', module: '9', channel: '8', deviceId: '7' },
    ]);
    assert.strictEqual(reloaded.scenes.length, 1);
    assert.strictEqual(reloaded.pages.length, 1);
    assert.throws(() => store.saveFloors(7, []), /from 1 to 6/);
}));

test('the Electron adapter treats a plain-text Linux backend as unavailable', () => {
    const safe = (backend, available = true) => ({
        isEncryptionAvailable: () => available,
        getSelectedStorageBackend: () => backend,
        encryptString: (text) => Buffer.from(text),
        decryptString: (buffer) => buffer.toString(),
    });
    assert.strictEqual(createElectronSecrets(safe('gnome_libsecret'), 'linux').isAvailable(), true);
    assert.strictEqual(createElectronSecrets(safe('basic_text'), 'linux').isAvailable(), false);
    assert.strictEqual(createElectronSecrets(safe('basic_text'), 'win32').isAvailable(), true);
    assert.strictEqual(createElectronSecrets(safe('gnome_libsecret', false), 'linux').isAvailable(), false);
    assert.ok(createElectronSecrets(safe('basic_text'), 'linux').unavailableReason().length > 0);
});

test('saving the connection settings reports an unavailable safe storage as an error status', withDir(async (dir) => {
    const statuses = [];
    main.setConnectionStatusHandler((status) => statuses.push(status));
    main.setDataDir(dir);
    main.setSecretStore(fakeSecrets({ available: false }));
    try {
        await assert.rejects(main.saveGeneralSettings('10.0.0.1', 'admin', 's3cret', 'http'), /safeStorage|keyring|secure/i);
        assert.strictEqual(main.getSettings().secureStorage.available, false);
        assert.ok(!fs.readFileSync(path.join(dir, 'settings.json'), 'utf8').includes('s3cret'));
    } finally {
        main.setConnectionStatusHandler(() => {});
        main.setSecretStore(null);
    }
}));

test('connecting with a saved password that cannot be unlocked reports why', withDir(async (dir) => {
    fs.writeFileSync(path.join(dir, 'settings.csv'), LEGACY);
    const statuses = [];
    main.setConnectionStatusHandler((status) => statuses.push(status));
    main.setDataDir(dir);
    main.setSecretStore(fakeSecrets({ available: false }));
    try {
        const status = await main.connectFromSettings();
        assert.strictEqual(status.state, 'error');
        assert.match(status.message, /old settings file/);
        assert.strictEqual(main.getConnectionStatus().state, 'error');
        assert.strictEqual(statuses[statuses.length - 1].state, 'error');
    } finally {
        main.setConnectionStatusHandler(() => {});
        main.setSecretStore(null);
    }
}));

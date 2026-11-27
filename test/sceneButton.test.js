const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const loadScene = () => import('../src/Modules/sceneButton.js');
const loadSettings = () => import('../src/Modules/settingsManagement.js');
const main = require('../src/Scripts/mainFunctions');

test('a scene button recalls its scene with the documented $SCNRECALL command', async () => {
    const { recallCommand, stateQuery, activateCommand, describeScene } = await loadScene();
    const button = { scene: '008' };
    assert.strictEqual(recallCommand(button), '$SCNRECALL,8;');
    assert.strictEqual(stateQuery(button), '?SCN,8;');
    assert.strictEqual(activateCommand(button), '$SCNRECALL,8;?SCN,8;');
    assert.strictEqual(describeScene(button), 'Scene 8');
});

test('buttons without a valid scene number send nothing', async () => {
    const { sceneNumber, recallCommand, stateQuery, activateCommand, describeScene } = await loadScene();
    for (const button of [{ scene: '0' }, { scene: '' }, { scene: 'a' }, { scene: '8;' }, { scene: '8,9' }, { scene: '100000' }, { scene: '-1' }, {}, null]) {
        assert.strictEqual(sceneNumber(button), null);
        assert.strictEqual(recallCommand(button), null);
        assert.strictEqual(stateQuery(button), null);
        assert.strictEqual(activateCommand(button), null);
        assert.strictEqual(describeScene(button), 'No scene assigned');
    }
    assert.strictEqual(sceneNumber({ scene: '99999' }), 99999);
});

test('scene state replies and events are parsed', async () => {
    const { parseSceneMessage, reportMatchesScene } = await loadScene();
    assert.deepStrictEqual(parseSceneMessage('!SCN,00001,01,02,001,255;'), { scene: 1, active: true, level: 255 });
    assert.deepStrictEqual(parseSceneMessage('!SCN,00002,02,02,000,000;'), { scene: 2, active: false, level: 0 });
    assert.deepStrictEqual(parseSceneMessage('!SCNSTATE,00001,1,255,00001000;'), { scene: 1, active: true, level: 255 });
    assert.deepStrictEqual(parseSceneMessage('!scnstate,3,0,0,500;'), { scene: 3, active: false, level: 0 });

    for (const message of ['!OK,SCNRECALL,00008;', '!SCNRECALL,00008;', '!SCN,1,2;', '!SCNSTATE,x,1,255,0;', '$SCNRECALL,8;', '', null, '!CHANLEVELX,1,12,2,30,1,0;']) {
        assert.strictEqual(parseSceneMessage(message), null);
    }

    assert.strictEqual(reportMatchesScene({ scene: '001' }, { scene: 1 }), true);
    assert.strictEqual(reportMatchesScene({ scene: '2' }, { scene: 1 }), false);
    assert.strictEqual(reportMatchesScene({ scene: '0' }, { scene: 0 }), false);
});

test('scene buttons are read from the settings view', async () => {
    const { loadSceneButtonData, loadLightData } = await loadSettings();
    const settings = {
        lights: [{ id: 1, floor: 1, x: 50, y: 50, name: 'Lamp', module: '001', channel: '001', deviceId: '001' }],
        scenes: [
            { id: 1, floor: 2, x: 20.5, y: 10, name: 'Evening', scene: '12' },
            { id: 2, floor: 1, x: 30, y: 40, name: 'Off', scene: '3' },
        ],
    };
    assert.deepStrictEqual(loadSceneButtonData(settings), [
        { id: 1, floor: 2, left: '20.5000%', top: '10.0000%', name: 'Evening', scene: '12' },
        { id: 2, floor: 1, left: '30.0000%', top: '40.0000%', name: 'Off', scene: '3' },
    ]);
    assert.strictEqual(loadLightData(settings).length, 1);
    assert.deepStrictEqual(loadSceneButtonData({ lights: settings.lights }), []);
});

test('saving a scene button adds then replaces its record without touching lights', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'floorplan-'));
    try {
        main.setDataDir(dir);
        main.ensureSettings();
        const lightsBefore = main.getSettings().lights;

        await main.saveSceneButton({ id: 1, floor: 1, x: 20, y: 10, name: 'Evening', scene: '12' });
        await main.saveSceneButton({ id: 2, floor: 1, x: 30, y: 40, name: 'Off', scene: '3' });
        await main.saveSceneButton({ id: 1, floor: 1, x: 25, y: 15, name: 'Late night', scene: '13' });

        const saved = JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'));
        assert.deepStrictEqual(saved.scenes, [
            { id: 1, floor: 1, x: 25, y: 15, name: 'Late night', scene: '13' },
            { id: 2, floor: 1, x: 30, y: 40, name: 'Off', scene: '3' },
        ]);
        assert.deepStrictEqual(saved.lights, lightsBefore);
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

test('invalid scene button records are rejected', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'floorplan-'));
    try {
        main.setDataDir(dir);
        const base = { id: 1, floor: 1, x: 1, y: 1, name: 'A', scene: '1' };
        await assert.rejects(main.saveSceneButton({ ...base, scene: '1;$X' }));
        await assert.rejects(main.saveSceneButton({ ...base, scene: 'abc' }));
        await assert.rejects(main.saveSceneButton({ ...base, floor: 7 }));
        await assert.rejects(main.saveSceneButton({ ...base, id: 0 }));
        await assert.rejects(main.saveSceneButton({ ...base, x: 'a' }));
        assert.deepStrictEqual(main.getSettings().scenes, []);
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

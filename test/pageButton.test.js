const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const loadPage = () => import('../src/Modules/pageButton.js');
const loadSettings = () => import('../src/Modules/settingsManagement.js');
const main = require('../src/Scripts/mainFunctions');

test('a page button targets a page that exists', async () => {
    const { targetPage, describeTarget } = await loadPage();
    assert.strictEqual(targetPage({ target: '2' }, 3), 2);
    assert.strictEqual(targetPage({ target: '02' }, 3), 2);
    assert.strictEqual(targetPage({ target: '6' }), 6);
    assert.strictEqual(describeTarget({ target: '2' }, ['Ground', 'First']), 'Opens First');
    assert.strictEqual(describeTarget({ target: '1' }, []), 'Opens Page 1');
});

test('page buttons without a usable target open nothing', async () => {
    const { targetPage, describeTarget } = await loadPage();
    for (const button of [{ target: '0' }, { target: '' }, { target: 'a' }, { target: '1;2' }, { target: '-1' }, { target: '7' }, {}, null]) {
        assert.strictEqual(targetPage(button), null);
        assert.strictEqual(describeTarget(button, ['A', 'B']), 'No page assigned');
    }
    assert.strictEqual(targetPage({ target: '3' }, 2), null);
    assert.strictEqual(describeTarget({ target: '3' }, ['A', 'B']), 'No page assigned');
});

test('page buttons are read from the settings view without disturbing other items', async () => {
    const { loadPageButtonData, loadSceneButtonData, loadLightData } = await loadSettings();
    const settings = {
        lights: [{ id: 1, floor: 1, x: 50, y: 50, name: 'Lamp', module: '001', channel: '001', deviceId: '001' }],
        scenes: [{ id: 1, floor: 1, x: 20, y: 10, name: 'Evening', scene: '12' }],
        pages: [
            { id: 1, floor: 1, x: 10.5, y: 90, name: 'Upstairs', target: '2' },
            { id: 2, floor: 2, x: 10, y: 90, name: 'Downstairs', target: '1' },
        ],
    };
    assert.deepStrictEqual(loadPageButtonData(settings), [
        { id: 1, floor: 1, left: '10.5000%', top: '90.0000%', name: 'Upstairs', target: '2' },
        { id: 2, floor: 2, left: '10.0000%', top: '90.0000%', name: 'Downstairs', target: '1' },
    ]);
    assert.strictEqual(loadSceneButtonData(settings).length, 1);
    assert.strictEqual(loadLightData(settings).length, 1);
});

test('saving a page button adds then replaces its record and leaves scene buttons and lights alone', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'floorplan-'));
    try {
        main.setDataDir(dir);
        main.ensureSettings();
        await main.saveSceneButton({ id: 1, floor: 1, x: 20, y: 10, name: 'Evening', scene: '12' });
        const before = main.getSettings();

        await main.savePageButton({ id: 1, floor: 1, x: 10, y: 90, name: 'Up', target: '2' });
        await main.savePageButton({ id: 2, floor: 2, x: 10, y: 90, name: 'Down', target: '1' });
        await main.savePageButton({ id: 1, floor: 1, x: 12, y: 80, name: 'Up stairs', target: '3' });

        const saved = JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'));
        assert.deepStrictEqual(saved.pages, [
            { id: 1, floor: 1, x: 12, y: 80, name: 'Up stairs', target: '3' },
            { id: 2, floor: 2, x: 10, y: 90, name: 'Down', target: '1' },
        ]);
        assert.deepStrictEqual(saved.scenes, before.scenes);
        assert.deepStrictEqual(saved.lights, before.lights);
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

test('invalid page button records are rejected', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'floorplan-'));
    try {
        main.setDataDir(dir);
        const base = { id: 1, floor: 1, x: 1, y: 1, name: 'A', target: '1' };
        await main.savePageButton({ ...base, target: '0' });
        assert.strictEqual(main.getSettings().pages[0].target, '0');
        await assert.rejects(main.savePageButton({ ...base, target: '1;$X' }));
        await assert.rejects(main.savePageButton({ ...base, target: 'abc' }));
        await assert.rejects(main.savePageButton({ ...base, target: '7' }));
        await assert.rejects(main.savePageButton({ ...base, floor: 7 }));
        await assert.rejects(main.savePageButton({ ...base, id: 0 }));
        await assert.rejects(main.savePageButton({ ...base, y: 'a' }));
        assert.strictEqual(main.getSettings().pages.length, 1);
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

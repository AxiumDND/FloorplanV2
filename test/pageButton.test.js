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

test('page buttons are read from the settings file without disturbing other items', async () => {
    const { loadPageButtonData, loadSceneButtonData, loadLightData } = await loadSettings();
    const csv = [
        '$Lightsetting;1;floor,1,50.0000%,50.0000%,Lamp,001,001,001;',
        '$Scenebutton;1;floor,1,20.0000%,10.0000%,Evening,12;',
        '$Pagebutton;1;floor,1,10.5000%,90.0000%,Upstairs,2;',
        '$Pagebutton;2;floor,2,10.0000%,90.0000%,Downstairs,1;',
    ].join('\n');
    assert.deepStrictEqual(loadPageButtonData(csv), [
        { id: 1, floor: 1, left: '10.5000%', top: '90.0000%', name: 'Upstairs', target: '2' },
        { id: 2, floor: 2, left: '10.0000%', top: '90.0000%', name: 'Downstairs', target: '1' },
    ]);
    assert.strictEqual(loadSceneButtonData(csv).length, 1);
    assert.strictEqual(loadLightData(csv).length, 1);
});

test('saving a page button adds then replaces its line and leaves scene buttons and lights alone', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'floorplan-'));
    try {
        main.setDataDir(dir);
        const file = path.join(dir, 'settings.csv');
        const before = [
            '$Lightsetting;1;floor,1,50.0000%,50.0000%,Lamp,001,001,001;',
            '$Scenebutton;1;floor,1,20.0000%,10.0000%,Evening,12;',
            '',
        ].join('\n');
        fs.writeFileSync(file, before);

        await main.savePageButton({ id: 1, floor: 1, x: 10, y: 90, name: 'Up', target: '2' });
        await main.savePageButton({ id: 2, floor: 2, x: 10, y: 90, name: 'Down', target: '1' });
        await main.savePageButton({ id: 1, floor: 1, x: 12, y: 80, name: 'Up, stairs;', target: '3' });

        assert.strictEqual(
            fs.readFileSync(file, 'utf8'),
            [
                '$Lightsetting;1;floor,1,50.0000%,50.0000%,Lamp,001,001,001;',
                '$Scenebutton;1;floor,1,20.0000%,10.0000%,Evening,12;',
                '$Pagebutton;1;floor,1,12.0000%,80.0000%,Up stairs,3;',
                '$Pagebutton;2;floor,2,10.0000%,90.0000%,Down,1;',
                '',
            ].join('\n')
        );
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

test('invalid page button records are rejected', () => {
    const base = { id: 1, floor: 1, x: 1, y: 1, name: 'A', target: '1' };
    assert.strictEqual(main.formatPageLine({ ...base, target: '0' }), '$Pagebutton;1;floor,1,1.0000%,1.0000%,A,0;');
    assert.throws(() => main.formatPageLine({ ...base, target: '1;$X' }));
    assert.throws(() => main.formatPageLine({ ...base, target: 'abc' }));
    assert.throws(() => main.formatPageLine({ ...base, target: '7' }));
    assert.throws(() => main.formatPageLine({ ...base, floor: 7 }));
    assert.throws(() => main.formatPageLine({ ...base, id: 0 }));
    assert.throws(() => main.formatPageLine({ ...base, y: 'a' }));
});

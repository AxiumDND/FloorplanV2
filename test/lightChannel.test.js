const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { createGatewayConnection } = require('../src/Scripts/gatewayConnection');

const load = () => import('../src/Modules/lightChannel.js');

test('a light maps to <addr>,<devcode>,<chan-num> from module, device ID and channel', async () => {
    const { channelAddress, levelQuery, fadeCommand } = await load();
    const light = { module: '001', deviceId: '012', channel: '002' };
    assert.deepStrictEqual(channelAddress(light), { addr: 1, devcode: 12, chan: 2 });
    assert.strictEqual(levelQuery(light), '?CHANLEVELX,1,12,2;');
    assert.strictEqual(fadeCommand(light, 30, 3000), '$CHANFADE,1,12,2,30,3000;');
});

test('lights without a valid channel send no commands', async () => {
    const { channelAddress, levelQuery, fadeCommand, describeChannel } = await load();
    for (const light of [
        { module: '0', deviceId: '0', channel: '0' },
        { module: '512', deviceId: '12', channel: '1' },
        { module: '1', deviceId: '256', channel: '1' },
        { module: 'a', deviceId: '12', channel: '1' },
        { module: '1;', deviceId: '12', channel: '1' },
        { module: '', deviceId: '', channel: '' },
        {},
    ]) {
        assert.strictEqual(channelAddress(light), null);
        assert.strictEqual(levelQuery(light), null);
        assert.strictEqual(fadeCommand(light, 255), null);
        assert.strictEqual(describeChannel(light), 'No channel assigned');
    }
});

test('levels are 0-255 and clamp; percent conversion round-trips the ends', async () => {
    const { fadeCommand, percentToLevel, levelToPercent } = await load();
    const light = { module: '1', deviceId: '12', channel: '2' };
    assert.strictEqual(fadeCommand(light, 999, 0), '$CHANFADE,1,12,2,255,0;');
    assert.strictEqual(fadeCommand(light, -5, 0), '$CHANFADE,1,12,2,0,0;');
    assert.strictEqual(percentToLevel(0), 0);
    assert.strictEqual(percentToLevel(100), 255);
    assert.strictEqual(percentToLevel(50), 128);
    assert.strictEqual(levelToPercent(255), 100);
    assert.strictEqual(levelToPercent(0), 0);
    assert.strictEqual(levelToPercent(30), 12);
});

test('parses documented channel replies and events, ignores everything else', async () => {
    const { parseChannelMessage } = await load();
    assert.deepStrictEqual(parseChannelMessage('!CHANLEVELX,001,012,002,030,099,00100;'), {
        type: 'level', addr: 1, devcode: 12, chan: 2, level: 30,
    });
    assert.deepStrictEqual(parseChannelMessage('!CHANLEVEL,001,012,002,255,099,00100;'), {
        type: 'level', addr: 1, devcode: 12, chan: 2, level: 255,
    });
    assert.deepStrictEqual(parseChannelMessage('!CHANFADE,002,021,006,255,00003000;'), {
        type: 'level', addr: 2, devcode: 21, chan: 6, level: 255,
    });
    assert.deepStrictEqual(parseChannelMessage('!CHANSTOP,002,021,006;'), {
        type: 'stopped', addr: 2, devcode: 21, chan: 6,
    });
    assert.deepStrictEqual(parseChannelMessage('!CHANERR,001,012,002,003;'), {
        type: 'status', addr: 1, devcode: 12, chan: 2, status: 3,
    });
    assert.strictEqual(parseChannelMessage('!OK,CHANFADE,001,012,002,030,00003000;'), null);
    assert.strictEqual(parseChannelMessage('!OK,CHANLEVELX,001,012,002;'), null);
    assert.strictEqual(parseChannelMessage('!CHANLEVELX,001,012;'), null);
    assert.strictEqual(parseChannelMessage('!DALILEVEL,001,017,002,254,099,02500;'), null);
    assert.strictEqual(parseChannelMessage('!BAD;'), null);
    assert.strictEqual(parseChannelMessage('nonsense'), null);
});

test('reports match lights by numeric channel identity, ignoring zero padding', async () => {
    const { parseChannelMessage, reportMatchesLight } = await load();
    const report = parseChannelMessage('!CHANLEVELX,001,012,002,030,099,00100;');
    assert.ok(reportMatchesLight({ module: '1', deviceId: '12', channel: '2' }, report));
    assert.ok(reportMatchesLight({ module: '001', deviceId: '012', channel: '002' }, report));
    assert.ok(!reportMatchesLight({ module: '1', deviceId: '12', channel: '3' }, report));
    assert.ok(!reportMatchesLight({ module: '0', deviceId: '0', channel: '0' }, report));
});

test('a light level change goes out over HTTP as a documented $CHANFADE and the reply updates the light', async () => {
    const { fadeCommand, levelQuery, parseChannelMessage, reportMatchesLight } = await load();
    const bodies = [];
    const server = http.createServer((req, res) => {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
            bodies.push(body);
            const query = body.match(/\?CHANLEVELX,(\d+),(\d+),(\d+);/);
            res.end(query ? `!OK,CHANLEVELX,001,012,002;\r\n!CHANLEVELX,001,012,002,128,050,00100;\r\n` : '!OK;\r\n');
        });
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

    const messages = [];
    const connection = createGatewayConnection({ onMessage: (message) => messages.push(message) });
    connection.connect({ type: 'http', host: '127.0.0.1', httpPort: server.address().port });
    for (let i = 0; i < 100 && connection.getStatus().state !== 'connected'; i++) {
        await new Promise((resolve) => setTimeout(resolve, 20));
    }

    const light = { module: '1', deviceId: '12', channel: '2' };
    assert.ok(connection.send(fadeCommand(light, 128, 500)));
    assert.ok(connection.send(levelQuery(light)));
    for (let i = 0; i < 100 && !messages.some((m) => m.startsWith('!CHANLEVELX')); i++) {
        await new Promise((resolve) => setTimeout(resolve, 20));
    }

    assert.ok(bodies.includes('$CHANFADE,1,12,2,128,500;'));
    assert.ok(bodies.includes('?CHANLEVELX,1,12,2;'));
    const report = messages.map(parseChannelMessage).find(Boolean);
    assert.ok(reportMatchesLight(light, report));
    assert.strictEqual(report.level, 128);

    connection.disconnect();
    server.close();
    server.closeAllConnections?.();
});

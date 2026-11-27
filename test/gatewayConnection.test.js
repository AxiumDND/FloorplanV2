const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const net = require('net');
const { createGatewayConnection, validateSettings } = require('../src/Scripts/gatewayConnection');

const USER = 'William';
const PASS = 'Greensleeves';

function listen(server) {
    return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));
}

function tracker() {
    const statuses = [];
    const messages = [];
    const connection = createGatewayConnection({
        onStatus: (status) => statuses.push(status),
        onMessage: (message) => messages.push(message),
    });
    const waitFor = async (state) => {
        for (let i = 0; i < 100; i++) {
            if (statuses.some((status) => status.state === state)) {
                return statuses.find((status) => status.state === state);
            }
            await new Promise((resolve) => setTimeout(resolve, 20));
        }
        throw new Error(`Never reached ${state}; saw ${statuses.map((s) => s.state).join(',')}`);
    };
    return { connection, statuses, messages, waitFor };
}

// Answers like a gateway: acknowledges every command and checks $USER credentials.
function gatewayReply(body) {
    let out = '';
    for (const command of body.match(/[$?][^;]*;/g) || []) {
        const parts = command.slice(1, -1).split(',');
        const id = parts[0].toUpperCase();
        if (id === 'USER' && parts.length === 3) {
            out += `!OK,USER,${parts[1]},${parts[2]};\r\n`;
            out += `!USERERR,${parts[1]},${parts[1] === USER && parts[2] === PASS ? 0 : 1};\r\n`;
        } else if (id === 'OK') {
            out += '!OK;\r\n';
        } else {
            out += `!OK,${id};\r\n!CHANLEVELX,001,001,001,100;\r\n`;
        }
    }
    return out;
}

async function httpGateway() {
    const requests = [];
    const server = http.createServer((req, res) => {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
            requests.push({ method: req.method, url: req.url, type: req.headers['content-type'], body });
            res.setHeader('Content-Type', 'text/plain');
            res.end(gatewayReply(body));
        });
    });
    const port = await listen(server);
    return { server, port, requests };
}

async function tcpGateway() {
    const received = [];
    const server = net.createServer((socket) => {
        socket.write('!GATRDY;\r\n!VERSION,02.00;\r\n');
        socket.on('data', (data) => {
            received.push(data.toString());
            socket.write(gatewayReply(data.toString()));
        });
    });
    const port = await listen(server);
    return { server, port, received };
}

test('validateSettings rejects bad hosts and credentials the protocol cannot carry', () => {
    assert.match(validateSettings({ host: '' }), /required/);
    assert.match(validateSettings({ host: 'a b' }), /IP address/);
    assert.match(validateSettings({ host: '10.0.0.1', username: 'a,b' }), /commas/);
    assert.match(validateSettings({ host: '10.0.0.1', username: 'a', password: 'x;y' }), /semicolons/);
    assert.match(validateSettings({ host: '10.0.0.1', username: '', password: 'x' }), /needs a username/);
    assert.strictEqual(validateSettings({ host: '192.168.0.2', username: USER, password: PASS }), null);
});

test('HTTP: POSTs to /gateway? as text/plain with $USER first, connects as the user', async () => {
    const gateway = await httpGateway();
    const { connection, waitFor, messages } = tracker();
    connection.connect({ type: 'http', host: '127.0.0.1', httpPort: gateway.port, username: USER, password: PASS });

    const status = await waitFor('connected');
    assert.strictEqual(status.user, USER);
    assert.strictEqual(gateway.requests[0].method, 'POST');
    assert.strictEqual(gateway.requests[0].url, '/gateway?');
    assert.strictEqual(gateway.requests[0].type, 'text/plain');
    assert.strictEqual(gateway.requests[0].body, `$USER,${USER},${PASS};$OK;`);

    connection.send('?CHANLEVELX,001,001,001;');
    for (let i = 0; i < 50 && !messages.some((message) => message.startsWith('!CHANLEVELX')); i++) {
        await new Promise((resolve) => setTimeout(resolve, 20));
    }
    assert.strictEqual(gateway.requests[1].body, `$USER,${USER},${PASS};?CHANLEVELX,001,001,001;`);
    assert.ok(messages.some((message) => message.startsWith('!CHANLEVELX')));
    assert.ok(!messages.some((message) => /USER/.test(message)), 'login acks are not forwarded');
    connection.disconnect();
    gateway.server.close();
    gateway.server.closeAllConnections?.();
});

test('HTTP: no username connects as Public without sending $USER', async () => {
    const gateway = await httpGateway();
    const { connection, waitFor } = tracker();
    connection.connect({ type: 'http', host: '127.0.0.1', httpPort: gateway.port });
    const status = await waitFor('connected');
    assert.strictEqual(status.user, 'Public');
    assert.strictEqual(gateway.requests[0].body, '$OK;');
    connection.disconnect();
    gateway.server.close();
    gateway.server.closeAllConnections?.();
});

test('HTTP: wrong password reports login-failed', async () => {
    const gateway = await httpGateway();
    const { connection, waitFor } = tracker();
    connection.connect({ type: 'http', host: '127.0.0.1', httpPort: gateway.port, username: USER, password: 'nope' });
    const status = await waitFor('login-failed');
    assert.match(status.message, /Login failed/);
    assert.strictEqual(connection.send('$OK;'), false);
    connection.disconnect();
    gateway.server.close();
    gateway.server.closeAllConnections?.();
});

test('HTTP: unreachable system reports an error', async () => {
    const gateway = await httpGateway();
    const port = gateway.port;
    await new Promise((resolve) => gateway.server.close(resolve));
    const { connection, waitFor } = tracker();
    connection.connect({ type: 'http', host: '127.0.0.1', httpPort: port });
    await waitFor('error');
    connection.disconnect();
});

test('TCP: waits for !GATRDY, logs in with $USER and connects as the user', async () => {
    const gateway = await tcpGateway();
    const { connection, waitFor, messages } = tracker();
    connection.connect({ type: 'tcp', host: '127.0.0.1', tcpPort: gateway.port, username: USER, password: PASS });

    const status = await waitFor('connected');
    assert.strictEqual(status.user, USER);
    assert.strictEqual(status.type, 'tcp');
    assert.strictEqual(gateway.received[0], `$USER,${USER},${PASS};`);

    connection.send('?CHANLEVELX,001,001,001;');
    for (let i = 0; i < 50 && !messages.some((message) => message.startsWith('!CHANLEVELX')); i++) {
        await new Promise((resolve) => setTimeout(resolve, 20));
    }
    assert.ok(messages.some((message) => message.startsWith('!CHANLEVELX')));
    assert.ok(!messages.some((message) => /GATRDY|USER/.test(message)));
    connection.disconnect();
    gateway.server.close();
    gateway.server.closeAllConnections?.();
});

test('TCP: no username connects as Public and sends no login', async () => {
    const gateway = await tcpGateway();
    const { connection, waitFor } = tracker();
    connection.connect({ type: 'tcp', host: '127.0.0.1', tcpPort: gateway.port });
    const status = await waitFor('connected');
    assert.strictEqual(status.user, 'Public');
    assert.deepStrictEqual(gateway.received, []);
    connection.disconnect();
    gateway.server.close();
    gateway.server.closeAllConnections?.();
});

test('TCP: wrong password reports login-failed and closes the session', async () => {
    const gateway = await tcpGateway();
    const { connection, waitFor, statuses } = tracker();
    connection.connect({ type: 'tcp', host: '127.0.0.1', tcpPort: gateway.port, username: USER, password: 'nope' });
    await waitFor('login-failed');
    assert.strictEqual(connection.send('$OK;'), false);
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.strictEqual(statuses[statuses.length - 1].state, 'login-failed');
    connection.disconnect();
    gateway.server.close();
    gateway.server.closeAllConnections?.();
});

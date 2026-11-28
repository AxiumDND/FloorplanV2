const net = require('net');
const http = require('http');

// Gateway interface: raw TCP on port 26, or HTTP POST to http://<npu>/gateway?
// User login is `$USER,<user-name>,<password>;` answered by `!USERERR,<user-name>,<status-code>;`
// (status 0 = success, 1 = failed). HTTP has no session, so the login is sent with every request.
const TCP_PORT = 26;
const HTTP_PORT = 80;
const HTTP_PATH = '/gateway?';
const CONNECT_TIMEOUT_MS = 5000;
const RECONNECT_DELAY_MS = 5000;
// The gateway closes raw TCP sessions idle for one hour; `$OK;` keeps them open.
const KEEPALIVE_MS = 30 * 60 * 1000;

const CONNECTION_TYPES = ['http', 'tcp'];

function normalizeConnectionType(value) {
    return String(value || '').trim().toLowerCase() === 'tcp' ? 'tcp' : 'http';
}

function validateSettings(settings) {
    const host = String(settings.host || '').trim();
    const username = String(settings.username || '');
    const password = String(settings.password || '');

    if (!host) {
        return 'IP address is required.';
    }
    if (!/^[A-Za-z0-9.-]+$/.test(host)) {
        return 'IP address may only contain letters, numbers, dots and hyphens.';
    }
    if (/[,;\r\n]/.test(username) || /[,;\r\n]/.test(password)) {
        return 'Username and password cannot contain commas, semicolons or line breaks.';
    }
    if (!username && password) {
        return 'A password needs a username.';
    }
    return null;
}

function splitMessages(text) {
    return text.match(/![^;]*;/g) || [];
}

function messageParts(message) {
    return message.replace(/;$/, '').slice(1).split(',');
}

function isLoginAck(message) {
    const [id, second] = messageParts(message).map((part) => part.toUpperCase());
    return id === 'USERERR' || (id === 'OK' && second === 'USER');
}

function loginCommand(username, password) {
    return `$USER,${username},${password};`;
}

function createGatewayConnection({ onMessage = () => {}, onStatus = () => {}, log = () => {} } = {}) {
    let settings = null;
    let socket = null;
    let httpRequest = null;
    let reconnectTimer = null;
    let keepAliveTimer = null;
    let readyTimer = null;
    let generation = 0;
    let status = { state: 'disconnected', type: 'http', host: '', user: '', message: '' };

    function setStatus(state, extra = {}) {
        status = {
            state,
            type: settings ? settings.type : status.type,
            host: settings ? settings.host : status.host,
            user: '',
            message: '',
            ...extra,
        };
        onStatus({ ...status });
    }

    function clearTimers() {
        clearTimeout(reconnectTimer);
        clearTimeout(readyTimer);
        clearInterval(keepAliveTimer);
        reconnectTimer = null;
        readyTimer = null;
        keepAliveTimer = null;
    }

    function teardown() {
        generation += 1;
        clearTimers();
        if (socket) {
            socket.removeAllListeners();
            socket.on('error', () => {});
            socket.destroy();
            socket = null;
        }
        if (httpRequest) {
            httpRequest.destroy();
            httpRequest = null;
        }
    }

    function handleLoginReply(message) {
        const [, name, code] = messageParts(message);
        if (code === '0') {
            return { ok: true, user: name };
        }
        return { ok: false };
    }

    function loginFailed() {
        teardown();
        setStatus('login-failed', { message: 'Login failed. Check the username and password.' });
    }

    function httpExchange(body) {
        return new Promise((resolve, reject) => {
            const request = http.request(
                {
                    host: settings.host,
                    port: settings.httpPort || HTTP_PORT,
                    path: HTTP_PATH,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain',
                        'Content-Length': Buffer.byteLength(body),
                    },
                    timeout: CONNECT_TIMEOUT_MS,
                },
                (response) => {
                    let text = '';
                    response.setEncoding('utf8');
                    response.on('data', (chunk) => {
                        text += chunk;
                    });
                    response.on('end', () => {
                        if (response.statusCode !== 200) {
                            reject(new Error(`System answered HTTP ${response.statusCode}.`));
                        } else {
                            resolve(text);
                        }
                    });
                }
            );
            request.on('timeout', () => request.destroy(new Error('Connection timed out.')));
            request.on('error', reject);
            request.end(body);
        });
    }

    function httpBody(command) {
        const login = settings.username ? loginCommand(settings.username, settings.password) : '';
        return `${login}${command}`;
    }

    // Returns the replies for `command`, with the login acknowledgements removed.
    async function httpSend(command) {
        const text = await httpExchange(httpBody(command));
        const messages = splitMessages(text);
        let user = 'Public';

        if (settings.username) {
            const reply = messages.find((message) => messageParts(message)[0].toUpperCase() === 'USERERR');
            if (!reply) {
                throw new Error('The system did not answer the login. It may not support user accounts.');
            }
            const result = handleLoginReply(reply);
            if (!result.ok) {
                const error = new Error('Login failed. Check the username and password.');
                error.loginFailed = true;
                throw error;
            }
            user = result.user;
        }
        return { user, messages: messages.filter((message) => !isLoginAck(message)) };
    }

    async function connectHttp() {
        const current = generation;
        setStatus('connecting');
        try {
            const { user, messages } = await httpSend('$OK;');
            if (current !== generation) {
                return;
            }
            if (!messages.some((message) => messageParts(message)[0].toUpperCase() === 'OK')) {
                throw new Error('The system did not answer like an eDIN+ gateway.');
            }
            setStatus('connected', { user });
        } catch (error) {
            if (current !== generation) {
                return;
            }
            if (error.loginFailed) {
                setStatus('login-failed', { message: error.message });
            } else {
                setStatus('error', { message: error.message });
            }
        }
    }

    function sendHttp(command) {
        const current = generation;
        httpSend(command)
            .then(({ user, messages }) => {
                if (current !== generation) {
                    return;
                }
                if (status.state !== 'connected') {
                    setStatus('connected', { user });
                }
                messages.forEach((message) => onMessage(message));
            })
            .catch((error) => {
                if (current !== generation) {
                    return;
                }
                if (error.loginFailed) {
                    setStatus('login-failed', { message: error.message });
                } else {
                    setStatus('error', { message: error.message });
                }
            });
        return true;
    }

    function connectTcp() {
        const current = generation;
        let buffer = '';
        let ready = false;
        let loggedIn = false;

        setStatus('connecting');
        socket = new net.Socket();
        socket.setEncoding('utf8');
        socket.setTimeout(CONNECT_TIMEOUT_MS);

        function onReady() {
            if (ready) {
                return;
            }
            ready = true;
            clearTimeout(readyTimer);
            socket.setTimeout(0);
            if (settings.username) {
                socket.write(loginCommand(settings.username, settings.password));
            } else {
                loggedIn = true;
                setStatus('connected', { user: 'Public' });
            }
            keepAliveTimer = setInterval(() => {
                if (socket && socket.writable) {
                    socket.write('$OK;');
                }
            }, KEEPALIVE_MS);
            keepAliveTimer.unref();
        }

        function handleMessage(message) {
            const id = messageParts(message)[0].toUpperCase();
            if (id === 'GATRDY') {
                onReady();
                return;
            }
            if (id === 'USERERR') {
                const result = handleLoginReply(message);
                if (result.ok) {
                    loggedIn = true;
                    setStatus('connected', { user: result.user });
                } else {
                    loginFailed();
                }
                return;
            }
            if (isLoginAck(message)) {
                return;
            }
            onMessage(message);
        }

        socket.on('connect', () => {
            log(`TCP connected to ${settings.host}:${settings.tcpPort || TCP_PORT}`);
            // Gateways announce themselves with !GATRDY; if that never arrives, carry on anyway.
            readyTimer = setTimeout(onReady, 1500);
        });

        socket.on('data', (data) => {
            buffer += data;
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop();
            lines.forEach((line) => {
                splitMessages(line).forEach(handleMessage);
            });
            if (/![^;]*;$/.test(buffer)) {
                splitMessages(buffer).forEach(handleMessage);
                buffer = '';
            }
        });

        socket.on('timeout', () => {
            socket.destroy(new Error('Connection timed out.'));
        });

        socket.on('error', (error) => {
            if (current !== generation) {
                return;
            }
            log(`TCP error: ${error.message}`);
            setStatus('error', { message: error.message });
        });

        socket.on('close', () => {
            if (current !== generation) {
                return;
            }
            clearTimers();
            socket = null;
            const wasError = status.state === 'error';
            if (!wasError) {
                setStatus('disconnected', {
                    message: loggedIn ? 'Connection to the system closed.' : 'The system closed the connection.',
                });
            }
            reconnectTimer = setTimeout(() => {
                if (current === generation) {
                    teardown();
                    connectTcp();
                }
            }, RECONNECT_DELAY_MS);
        });

        socket.connect(settings.tcpPort || TCP_PORT, settings.host);
    }

    function connect(next) {
        teardown();
        settings = {
            type: normalizeConnectionType(next.type),
            host: String(next.host || '').trim(),
            username: String(next.username || ''),
            password: String(next.password || ''),
            httpPort: next.httpPort,
            tcpPort: next.tcpPort,
        };

        if (!settings.host) {
            setStatus('disconnected', { message: 'No IP address set.' });
            return;
        }
        const problem = validateSettings(settings);
        if (problem) {
            setStatus('error', { message: problem });
            return;
        }

        if (settings.type === 'tcp') {
            connectTcp();
        } else {
            connectHttp();
        }
    }

    function disconnect() {
        teardown();
        setStatus('disconnected');
    }

    function send(command) {
        if (!settings || status.state === 'login-failed' || status.state === 'disconnected') {
            return false;
        }
        if (settings.type === 'tcp') {
            if (status.state !== 'connected' || !socket || !socket.writable) {
                return false;
            }
            socket.write(command);
            return true;
        }
        return sendHttp(command);
    }

    return {
        connect,
        disconnect,
        send,
        getStatus: () => ({ ...status }),
    };
}

module.exports = {
    CONNECTION_TYPES,
    TCP_PORT,
    HTTP_PORT,
    normalizeConnectionType,
    validateSettings,
    createGatewayConnection,
};

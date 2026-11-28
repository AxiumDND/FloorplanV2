// A light on the plan is one lighting channel of the connected eDIN+ system.
// It is identified by the three values the gateway Channel API uses: <addr>,<devcode>,<chan-num>
// (light.module = MBus address, light.deviceId = module device code, light.channel = channel number).
//
// Only documented gateway messages are used (docs/gateway-interface.md 7.2/7.3, vol 2 chapters 3 and 6):
//   $CHANFADE,<addr>,<devcode>,<chan-num>,<level>,<fadetime(ms)>;   set level (0-255)
//   ?CHANLEVELX,<addr>,<devcode>,<chan-num>;                         query live level
//   !CHANLEVELX / !CHANLEVEL,<addr>,<devcode>,<chan-num>,<level>,<power>,<wattage>;  level reply
//   !CHANFADE,<addr>,<devcode>,<chan-num>,<level>,<fadetime(ms)>;    output event ($EVTOUT,1;)
//   !CHANSTOP,<addr>,<devcode>,<chan-num>;                           output event ($EVTOUT,1;)
//   !CHANERR,<addr>,<devcode>,<chan-num>,<status-code>;              channel health

export const MAX_LEVEL = 255;
export const DEFAULT_FADE_MS = 500;
export const ENABLE_OUTPUT_EVENTS = '$EVTOUT,1;';

const LIMITS = {
    addr: [1, 511],
    devcode: [1, 255],
    chan: [1, 999],
};

function parseBounded(value, [min, max]) {
    const text = String(value ?? '').trim();
    if (!/^\d+$/.test(text)) {
        return null;
    }
    const number = Number(text);
    return number >= min && number <= max ? number : null;
}

// Returns { addr, devcode, chan } or null when the light is not tied to a valid channel yet.
export function channelAddress(light) {
    const addr = parseBounded(light && light.module, LIMITS.addr);
    const devcode = parseBounded(light && light.deviceId, LIMITS.devcode);
    const chan = parseBounded(light && light.channel, LIMITS.chan);
    if (addr === null || devcode === null || chan === null) {
        return null;
    }
    return { addr, devcode, chan };
}

export function describeChannel(light) {
    const address = channelAddress(light);
    if (!address) {
        return 'No channel assigned';
    }
    return `Module ${address.addr} / Device ${address.devcode} / Channel ${address.chan}`;
}

export function levelQuery(light) {
    const address = channelAddress(light);
    return address ? `?CHANLEVELX,${address.addr},${address.devcode},${address.chan};` : null;
}

export function clampLevel(level) {
    const number = Math.round(Number(level));
    if (!Number.isFinite(number)) {
        return 0;
    }
    return Math.min(MAX_LEVEL, Math.max(0, number));
}

export function fadeCommand(light, level, fadeMs = DEFAULT_FADE_MS) {
    const address = channelAddress(light);
    if (!address) {
        return null;
    }
    const fade = Math.max(0, Math.round(Number(fadeMs) || 0));
    return `$CHANFADE,${address.addr},${address.devcode},${address.chan},${clampLevel(level)},${fade};`;
}

export function levelToPercent(level) {
    return Math.round((clampLevel(level) * 100) / MAX_LEVEL);
}

export function percentToLevel(percent) {
    const number = Math.min(100, Math.max(0, Number(percent) || 0));
    return clampLevel((number * MAX_LEVEL) / 100);
}

export function reportMatchesLight(light, report) {
    const address = channelAddress(light);
    return Boolean(
        address && report && address.addr === report.addr && address.devcode === report.devcode && address.chan === report.chan
    );
}

function numbers(parts) {
    const values = parts.map((part) => (/^\d+$/.test(part.trim()) ? Number(part.trim()) : NaN));
    return values.every(Number.isFinite) ? values : null;
}

// Turns a gateway message into a channel report, or null for anything that is not about a channel.
// Reports: { type: 'level', level }, { type: 'stopped' } or { type: 'status', status } plus addr/devcode/chan.
export function parseChannelMessage(message) {
    const text = String(message || '').trim();
    if (!text.startsWith('!')) {
        return null;
    }
    const [id, ...rest] = text.replace(/;$/, '').slice(1).split(',');
    const name = id.toUpperCase();

    if (name === 'CHANLEVELX' || name === 'CHANLEVEL' || name === 'CHANFADE') {
        const values = numbers(rest.slice(0, 4));
        if (!values || values.length < 4) {
            return null;
        }
        const [addr, devcode, chan, level] = values;
        return { type: 'level', addr, devcode, chan, level: clampLevel(level) };
    }
    if (name === 'CHANSTOP') {
        const values = numbers(rest.slice(0, 3));
        if (!values || values.length < 3) {
            return null;
        }
        const [addr, devcode, chan] = values;
        return { type: 'stopped', addr, devcode, chan };
    }
    if (name === 'CHANERR') {
        const values = numbers(rest.slice(0, 4));
        if (!values || values.length < 4) {
            return null;
        }
        const [addr, devcode, chan, status] = values;
        return { type: 'status', addr, devcode, chan, status };
    }
    return null;
}

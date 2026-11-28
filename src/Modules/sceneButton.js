// A scene button on the plan triggers one eDIN+ scene, identified by its scene number (<scn-num>).
//
// Only documented gateway messages are used (docs/gateway-interface.md 6.1 and 6.2, vol 2 chapter 3):
//   $SCNRECALL,<scn-num>;                                              recall the scene (active, max level, configured fade)
//   ?SCN,<scn-num>;                                                    query the scene state
//   !SCN,<scn-num>,<mode>,<flags>,<scn-state>,<scn-level>;             state reply (v02.00+)
//   !SCNSTATE,<scn-num>,<scn-state>,<scn-level>,<fadetime(ms)>;        state event ($EVTSCN,1;)
//   $EVTSCN,1;                                                         ask for scene events (raw TCP only)

export const ENABLE_SCENE_EVENTS = '$EVTSCN,1;';

// The documented examples print scene numbers as 5 decimal digits (e.g. 00008).
const MAX_SCENE = 99999;

// Returns the scene number, or null when the button is not tied to a valid scene yet.
export function sceneNumber(button) {
    const text = String((button && button.scene) ?? '').trim();
    if (!/^\d+$/.test(text)) {
        return null;
    }
    const number = Number(text);
    return number >= 1 && number <= MAX_SCENE ? number : null;
}

export function describeScene(button) {
    const scene = sceneNumber(button);
    return scene === null ? 'No scene assigned' : `Scene ${scene}`;
}

export function recallCommand(button) {
    const scene = sceneNumber(button);
    return scene === null ? null : `$SCNRECALL,${scene};`;
}

export function stateQuery(button) {
    const scene = sceneNumber(button);
    return scene === null ? null : `?SCN,${scene};`;
}

// Recall, then ask for the real state so the button reflects what the system did (HTTP delivers no events).
export function activateCommand(button) {
    const recall = recallCommand(button);
    return recall === null ? null : `${recall}${stateQuery(button)}`;
}

export function reportMatchesScene(button, report) {
    const scene = sceneNumber(button);
    return Boolean(scene !== null && report && report.scene === scene);
}

function numbers(parts) {
    const values = parts.map((part) => (/^\d+$/.test(part.trim()) ? Number(part.trim()) : NaN));
    return values.every(Number.isFinite) ? values : null;
}

// Turns a gateway message into { scene, active, level }, or null for anything that is not a scene state report.
export function parseSceneMessage(message) {
    const text = String(message || '').trim();
    if (!text.startsWith('!')) {
        return null;
    }
    const [id, ...rest] = text.replace(/;$/, '').slice(1).split(',');
    const name = id.toUpperCase();

    if (name === 'SCN') {
        const values = numbers(rest.slice(0, 5));
        if (!values || values.length < 5) {
            return null;
        }
        const [scene, , , state, level] = values;
        return { scene, active: state === 1, level };
    }
    if (name === 'SCNSTATE') {
        const values = numbers(rest.slice(0, 3));
        if (!values || values.length < 3) {
            return null;
        }
        const [scene, state, level] = values;
        return { scene, active: state === 1, level };
    }
    return null;
}

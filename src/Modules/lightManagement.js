import { loadLightData } from './settingsManagement.js';
import { getCurrentFloor } from './floorManagement.js';
import {
    ENABLE_OUTPUT_EVENTS,
    channelAddress,
    describeChannel,
    fadeCommand,
    levelQuery,
    levelToPercent,
    parseChannelMessage,
    percentToLevel,
    reportMatchesLight,
} from './lightChannel.js';

let editingLight = null;

export function initializeLights(settingsData) {
    loadLightData(settingsData).forEach((light) => {
        const pane = document.getElementById(`floor-pane-${light.floor}`);
        if (!pane) {
            return;
        }
        const lightElement = createLightElement(light);
        pane.appendChild(lightElement);
        attachLightInteractions(lightElement);
    });
}

export async function addLightToCurrentFloor() {
    const floor = getCurrentFloor();
    const pane = document.getElementById(`floor-pane-${floor}`);
    if (!pane) {
        console.error('Current floor pane not found.');
        return;
    }

    const lightElement = createLightElement({
        id: nextLightId(),
        floor,
        left: '10%',
        top: '10%',
        name: 'New Light',
        module: '0',
        channel: '0',
        deviceId: '0',
        isOn: false,
    });

    if (document.body.dataset.lightsLocked === 'false') {
        lightElement.classList.remove('locked');
    }

    pane.appendChild(lightElement);
    attachLightInteractions(lightElement);
    await persistLight(lightElement);
}

export function bindLightEditor() {
    document.getElementById('save-light-button').addEventListener('click', async () => {
        if (!editingLight) {
            return;
        }

        editingLight.dataset.name = fieldValue('edit-light-name', 'New Light');
        editingLight.dataset.module = fieldValue('edit-light-module', '0');
        editingLight.dataset.deviceId = fieldValue('edit-light-device-id', '0');
        editingLight.dataset.channel = fieldValue('edit-light-channel', '0');
        resetLightLevel(editingLight);

        const saved = await persistLight(editingLight);
        if (saved) {
            queryLightLevel(editingLight);
            document.getElementById('lighteditmenu').classList.add('hidden');
            editingLight = null;
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            document.getElementById('lighteditmenu').classList.add('hidden');
            editingLight = null;
        }
    });
}

export function bindChannelFeedback() {
    document.addEventListener('tcp-message', (event) => {
        applyChannelReport(parseChannelMessage(event.detail));
    });

    let wasConnected = false;
    window.myAPI.onConnectionStatus((status) => {
        const connected = status.state === 'connected';
        // Events only reach raw TCP sessions; HTTP lights update from the hover query and their own commands.
        if (connected && !wasConnected && status.type === 'tcp') {
            window.myAPI.sendCommand(ENABLE_OUTPUT_EVENTS);
        }
        wasConnected = connected;
    });
}

function applyChannelReport(report) {
    if (!report) {
        return;
    }
    document.querySelectorAll('.light').forEach((light) => {
        if (!reportMatchesLight(light.dataset, report)) {
            return;
        }
        if (report.type === 'level') {
            setLightLevel(light, report.level);
        } else if (report.type === 'status') {
            light.classList.toggle('channel-error', report.status !== 0);
            refreshChannelDisplay(light);
        } else if (report.type === 'stopped') {
            queryLightLevel(light);
        }
    });
}

function queryLightLevel(light) {
    const command = levelQuery(light.dataset);
    if (command) {
        window.myAPI.sendCommand(command);
    }
}

function resetLightLevel(light) {
    delete light.dataset.level;
    delete light.dataset.lastLevel;
    light.classList.remove('on', 'channel-error');
    light.style.removeProperty('--level');
    const menu = light.querySelector('.LightHoverMenu');
    menu.querySelector('.light-level-slider').value = '0';
    menu.querySelector('.light-level-value').textContent = '0%';
    menu.querySelector('.light-power-toggle').checked = false;
    refreshChannelDisplay(light);
}

function setLightLevel(light, level) {
    light.dataset.level = String(level);
    if (level > 0) {
        light.dataset.lastLevel = String(level);
    }
    light.classList.toggle('on', level > 0);
    light.style.setProperty('--level', String(level / 255));

    const menu = light.querySelector('.LightHoverMenu');
    if (menu) {
        const percent = levelToPercent(level);
        menu.querySelector('.light-level-slider').value = String(percent);
        menu.querySelector('.light-level-value').textContent = `${percent}%`;
        menu.querySelector('.light-power-toggle').checked = level > 0;
    }
    refreshChannelDisplay(light);
}

function sendLightLevel(light, level) {
    const command = fadeCommand(light.dataset, level);
    if (!command) {
        return;
    }
    window.myAPI.sendCommand(command);
    setLightLevel(light, level);
}

function refreshChannelDisplay(light) {
    const assigned = channelAddress(light.dataset) !== null;
    light.classList.toggle('unassigned', !assigned);
    light.classList.toggle('channel', assigned);
    light.title = lightTitle(light);

    const menu = light.querySelector('.LightHoverMenu');
    if (menu) {
        menu.querySelector('.light-menu-name').textContent = light.dataset.name;
        menu.querySelector('.light-menu-channel').textContent = describeChannel(light.dataset);
        menu.querySelectorAll('input').forEach((input) => {
            input.disabled = !assigned;
        });
    }
}

function lightTitle(light) {
    const parts = [light.dataset.name, describeChannel(light.dataset)];
    if (light.dataset.level !== undefined && channelAddress(light.dataset)) {
        parts.push(`${levelToPercent(Number(light.dataset.level))}%`);
    }
    if (light.classList.contains('channel-error')) {
        parts.push('Channel reports a fault');
    }
    return parts.join(' - ');
}

function buildLightMenu(light) {
    const menu = document.createElement('div');
    menu.className = 'LightHoverMenu';
    menu.innerHTML = `
        <strong class="light-menu-name"></strong>
        <div class="light-menu-channel"></div>
        <label class="switch">
            <input type="checkbox" class="light-power-toggle" />
            <span class="slider"></span>
        </label>
        <input type="range" class="light-level-slider" min="0" max="100" step="1" value="0" />
        <span class="light-level-value">0%</span>
    `;

    const slider = menu.querySelector('.light-level-slider');
    const toggle = menu.querySelector('.light-power-toggle');

    slider.addEventListener('input', () => {
        menu.querySelector('.light-level-value').textContent = `${slider.value}%`;
    });
    slider.addEventListener('change', () => {
        sendLightLevel(light, percentToLevel(slider.value));
    });
    toggle.addEventListener('change', () => {
        const restore = Number(light.dataset.lastLevel) || percentToLevel(100);
        sendLightLevel(light, toggle.checked ? restore : 0);
    });
    return menu;
}

function createLightElement(light) {
    const lightElement = document.createElement('div');
    lightElement.className = 'light locked';
    lightElement.style.left = light.left;
    lightElement.style.top = light.top;
    lightElement.dataset.id = String(light.id);
    lightElement.dataset.floor = String(light.floor);
    lightElement.dataset.name = light.name;
    lightElement.dataset.module = light.module;
    lightElement.dataset.channel = light.channel;
    lightElement.dataset.deviceId = light.deviceId;

    lightElement.appendChild(buildLightMenu(lightElement));
    refreshChannelDisplay(lightElement);
    if (light.isOn) {
        setLightLevel(lightElement, 255);
    }

    return lightElement;
}

function attachLightInteractions(light) {
    light.addEventListener('mousedown', (event) => {
        if (event.button !== 0 || light.classList.contains('locked') || event.target.closest('.LightHoverMenu')) {
            return;
        }

        event.preventDefault();
        const shiftX = event.clientX - light.getBoundingClientRect().left;
        const shiftY = event.clientY - light.getBoundingClientRect().top;

        function onMouseMove(moveEvent) {
            const parent = light.parentElement;
            light.style.left = `${((moveEvent.pageX - shiftX) / parent.clientWidth) * 100}%`;
            light.style.top = `${((moveEvent.pageY - shiftY) / parent.clientHeight) * 100}%`;
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', onMouseMove);
            persistLight(light);
        }, { once: true });
    });

    light.addEventListener('mouseenter', () => {
        queryLightLevel(light);
    });

    light.addEventListener('dblclick', (event) => {
        event.stopPropagation();
        if (event.target.closest('.LightHoverMenu')) {
            return;
        }
        openLightEditor(light);
    });
}

function openLightEditor(light) {
    editingLight = light;
    document.getElementById('edit-light-name').value = light.dataset.name || '';
    document.getElementById('edit-light-module').value = light.dataset.module || '';
    document.getElementById('edit-light-device-id').value = light.dataset.deviceId || '';
    document.getElementById('edit-light-channel').value = light.dataset.channel || '';

    const menu = document.getElementById('lighteditmenu');
    const rect = light.getBoundingClientRect();
    menu.style.left = `${Math.min(rect.right + 8, window.innerWidth - 220)}px`;
    menu.style.top = `${Math.max(rect.top, 8)}px`;
    menu.classList.remove('hidden');
}

function lightRecord(light) {
    return {
        id: Number(light.dataset.id),
        floor: Number(light.dataset.floor),
        x: parseFloat(light.style.left),
        y: parseFloat(light.style.top),
        name: light.dataset.name,
        module: light.dataset.module,
        channel: light.dataset.channel,
        deviceId: light.dataset.deviceId,
    };
}

async function persistLight(light) {
    const result = await window.myAPI.saveLight(lightRecord(light));
    if (!result.success) {
        console.error('Failed to save light:', result.error);
    }
    return result.success;
}

function nextLightId() {
    const ids = [...document.querySelectorAll('.light')]
        .map((light) => parseInt(light.dataset.id, 10))
        .filter((id) => Number.isInteger(id));
    return ids.length ? Math.max(...ids) + 1 : 1;
}

function fieldValue(id, fallback) {
    const value = document.getElementById(id).value.trim();
    return value || fallback;
}

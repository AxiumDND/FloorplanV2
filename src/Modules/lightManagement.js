import { loadLightData } from './settingsManagement.js';
import { getCurrentFloor } from './floorManagement.js';

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
        editingLight.title = editingLight.dataset.name;

        const saved = await persistLight(editingLight);
        if (saved) {
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
    lightElement.title = light.name;

    if (light.isOn) {
        lightElement.classList.add('on');
    }

    return lightElement;
}

function attachLightInteractions(light) {
    light.addEventListener('mousedown', (event) => {
        if (event.button !== 0 || light.classList.contains('locked')) {
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

    light.addEventListener('mouseover', () => {
        const { module, deviceId, channel } = light.dataset;
        window.myAPI.sendTcpCommand(`?CHANLEVELX,${module},${deviceId},${channel};`);
    });

    light.addEventListener('dblclick', (event) => {
        event.stopPropagation();
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

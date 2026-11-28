import { loadSceneButtonData } from './settingsManagement.js';
import { getCurrentFloor } from './floorManagement.js';
import {
    ENABLE_SCENE_EVENTS,
    activateCommand,
    describeScene,
    parseSceneMessage,
    reportMatchesScene,
    sceneNumber,
    stateQuery,
} from './sceneButton.js';

let editingButton = null;

export function initializeSceneButtons(settingsData) {
    loadSceneButtonData(settingsData).forEach((button) => {
        const pane = document.getElementById(`floor-pane-${button.floor}`);
        if (!pane) {
            return;
        }
        const element = createSceneElement(button);
        pane.appendChild(element);
        attachSceneInteractions(element);
    });
}

export async function addSceneButtonToCurrentFloor() {
    const floor = getCurrentFloor();
    const pane = document.getElementById(`floor-pane-${floor}`);
    if (!pane) {
        console.error('Current floor pane not found.');
        return;
    }

    const element = createSceneElement({
        id: nextSceneId(),
        floor,
        left: '20%',
        top: '10%',
        name: 'New Scene',
        scene: '0',
    });
    if (document.body.dataset.lightsLocked === 'false') {
        element.classList.remove('locked');
    }
    pane.appendChild(element);
    attachSceneInteractions(element);
    await persistScene(element);
}

export function bindSceneEditor() {
    document.getElementById('save-scene-button').addEventListener('click', async () => {
        if (!editingButton) {
            return;
        }

        const scene = document.getElementById('edit-scene-number').value.trim();
        if (scene !== '0' && sceneNumber({ scene }) === null) {
            document.getElementById('edit-scene-error').textContent = 'Scene number must be a whole number from 1 to 99999.';
            return;
        }

        editingButton.dataset.name = fieldValue('edit-scene-name', 'New Scene');
        editingButton.dataset.scene = scene || '0';
        resetSceneState(editingButton);

        const saved = await persistScene(editingButton);
        if (saved) {
            querySceneState(editingButton);
            closeSceneEditor();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeSceneEditor();
        }
    });
}

export function bindSceneFeedback() {
    document.addEventListener('tcp-message', (event) => {
        applySceneReport(parseSceneMessage(event.detail));
    });

    let wasConnected = false;
    window.myAPI.onConnectionStatus((status) => {
        const connected = status.state === 'connected';
        // Events only reach raw TCP sessions; HTTP buttons update from the hover query and their own activation.
        if (connected && !wasConnected && status.type === 'tcp') {
            window.myAPI.sendCommand(ENABLE_SCENE_EVENTS);
        }
        wasConnected = connected;
    });
}

function applySceneReport(report) {
    if (!report) {
        return;
    }
    document.querySelectorAll('.scene-button').forEach((button) => {
        if (reportMatchesScene(button.dataset, report)) {
            button.classList.toggle('active', report.active);
            refreshSceneDisplay(button);
        }
    });
}

function querySceneState(button) {
    const command = stateQuery(button.dataset);
    if (command) {
        window.myAPI.sendCommand(command);
    }
}

function activateScene(button) {
    const command = activateCommand(button.dataset);
    if (command) {
        window.myAPI.sendCommand(command);
    }
}

function resetSceneState(button) {
    button.classList.remove('active');
    refreshSceneDisplay(button);
}

function refreshSceneDisplay(button) {
    const assigned = sceneNumber(button.dataset) !== null;
    button.classList.toggle('unassigned', !assigned);
    button.querySelector('.scene-button-name').textContent = button.dataset.name;
    const parts = [button.dataset.name, describeScene(button.dataset)];
    if (assigned) {
        parts.push(button.classList.contains('active') ? 'Active' : 'Inactive');
    }
    button.title = parts.join(' - ');
}

function createSceneElement(button) {
    const element = document.createElement('div');
    element.className = 'scene-button locked';
    element.style.left = button.left;
    element.style.top = button.top;
    element.dataset.id = String(button.id);
    element.dataset.floor = String(button.floor);
    element.dataset.name = button.name;
    element.dataset.scene = button.scene;

    const label = document.createElement('span');
    label.className = 'scene-button-name';
    element.appendChild(label);
    refreshSceneDisplay(element);
    return element;
}

function attachSceneInteractions(button) {
    button.addEventListener('mousedown', (event) => {
        if (event.button !== 0 || button.classList.contains('locked')) {
            return;
        }

        event.preventDefault();
        const shiftX = event.clientX - button.getBoundingClientRect().left;
        const shiftY = event.clientY - button.getBoundingClientRect().top;

        function onMouseMove(moveEvent) {
            const parent = button.parentElement;
            button.style.left = `${((moveEvent.pageX - shiftX) / parent.clientWidth) * 100}%`;
            button.style.top = `${((moveEvent.pageY - shiftY) / parent.clientHeight) * 100}%`;
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', onMouseMove);
            persistScene(button);
        }, { once: true });
    });

    // A locked plan is for using the buttons; unlock to move or edit them.
    button.addEventListener('click', () => {
        if (button.classList.contains('locked')) {
            activateScene(button);
        }
    });

    button.addEventListener('mouseenter', () => {
        querySceneState(button);
    });

    button.addEventListener('dblclick', (event) => {
        event.stopPropagation();
        if (!button.classList.contains('locked')) {
            openSceneEditor(button);
        }
    });
}

function openSceneEditor(button) {
    editingButton = button;
    document.getElementById('edit-scene-name').value = button.dataset.name || '';
    document.getElementById('edit-scene-number').value = button.dataset.scene || '';
    document.getElementById('edit-scene-error').textContent = '';

    const menu = document.getElementById('sceneeditmenu');
    const rect = button.getBoundingClientRect();
    menu.style.left = `${Math.min(rect.right + 8, window.innerWidth - 220)}px`;
    menu.style.top = `${Math.max(rect.top, 8)}px`;
    menu.classList.remove('hidden');
}

function closeSceneEditor() {
    document.getElementById('sceneeditmenu').classList.add('hidden');
    editingButton = null;
}

function sceneRecord(button) {
    return {
        id: Number(button.dataset.id),
        floor: Number(button.dataset.floor),
        x: parseFloat(button.style.left),
        y: parseFloat(button.style.top),
        name: button.dataset.name,
        scene: button.dataset.scene,
    };
}

async function persistScene(button) {
    const result = await window.myAPI.saveSceneButton(sceneRecord(button));
    if (!result.success) {
        console.error('Failed to save scene button:', result.error);
    }
    return result.success;
}

function nextSceneId() {
    const ids = [...document.querySelectorAll('.scene-button')]
        .map((button) => parseInt(button.dataset.id, 10))
        .filter((id) => Number.isInteger(id));
    return ids.length ? Math.max(...ids) + 1 : 1;
}

function fieldValue(id, fallback) {
    const value = document.getElementById(id).value.trim();
    return value || fallback;
}

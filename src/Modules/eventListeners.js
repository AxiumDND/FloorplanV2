import { addLightToCurrentFloor } from './lightManagement.js';
import { addSceneButtonToCurrentFloor } from './sceneManagement.js';
import { showConnectionStatus } from './connectionStatus.js';
import { getCurrentFloor, renderFloors, setFloorBackground, updateFloorNameInputs } from './floorManagement.js';

let isLocked = true;

export function addEventListeners() {
    document.body.dataset.lightsLocked = 'true';

    document.getElementById('add-light-btn').addEventListener('click', () => {
        addLightToCurrentFloor();
    });

    document.getElementById('add-scene-btn').addEventListener('click', () => {
        addSceneButtonToCurrentFloor();
    });

    document.getElementById('header-minimise-btn').addEventListener('click', () => {
        toggleClassPair('header-bar', 'header-bar-hidden', 'header-bar-visible');
    });

    document.getElementById('footer-edit-btn').addEventListener('click', () => {
        toggleClassPair('footer-bar', 'footer-bar-hidden', 'footer-bar-visible');
    });

    document.getElementById('open-settings-btn').addEventListener('click', () => {
        document.getElementById('settings-page').classList.remove('hidden');
    });

    document.getElementById('close-settings-btn').addEventListener('click', () => {
        document.getElementById('settings-page').classList.add('hidden');
    });

    document.getElementById('saveSettingsButton').addEventListener('click', async () => {
        const connectionType = document.getElementById('connection-type').value;
        const ip = document.getElementById('ip-address').value.trim();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const result = await window.myAPI.saveGeneralSettings(ip, username, password, connectionType);

        if (!result.success) {
            console.error('Failed to save general settings:', result.error);
            showConnectionStatus({ state: 'error', message: result.error });
        }
    });

    document.getElementById('number-of-Floors').addEventListener('change', (event) => {
        const numFloors = parseInt(event.target.value, 10);
        updateFloorNameInputs(numFloors);
    });

    document.getElementById('save-floor-names-btn').addEventListener('click', async () => {
        const numFloors = parseInt(document.getElementById('number-of-Floors').value, 10);
        const floorNames = [];
        for (let i = 1; i <= numFloors; i++) {
            const input = document.getElementById(`floor-name-${i}`);
            floorNames.push(input ? input.value : `Floor ${i}`);
        }

        const result = await window.myAPI.saveFloorSettings(numFloors, floorNames);
        if (!result.success) {
            console.error('Failed to save floor names:', result.error);
            return;
        }
        renderFloors(numFloors, floorNames);
    });

    document.getElementById('load-image-btn').addEventListener('click', () => {
        document.getElementById('image-loader').click();
    });

    document.getElementById('image-loader').addEventListener('change', async (event) => {
        const file = event.target.files && event.target.files[0];
        event.target.value = '';
        if (!file) {
            return;
        }

        const floor = getCurrentFloor();
        const result = await window.myAPI.copyFloorImage(floor, window.myAPI.pathForFile(file));
        if (!result.success) {
            console.error('Failed to load floor image:', result.error);
            return;
        }
        setFloorBackground(floor);
    });

    document.getElementById('lockButton').addEventListener('click', () => {
        setLightsLocked(!isLocked);
    });
}

function setLightsLocked(locked) {
    isLocked = locked;
    document.body.dataset.lightsLocked = locked ? 'true' : 'false';
    document.getElementById('lockButton').textContent = locked ? 'Unlock' : 'Lock';
    document.querySelectorAll('.scene-button').forEach((button) => {
        button.classList.toggle('locked', locked);
    });
    document.querySelectorAll('.light').forEach((light) => {
        light.classList.toggle('locked', locked);
    });
}

function toggleClassPair(elementId, hiddenClass, visibleClass) {
    const element = document.getElementById(elementId);
    const isHidden = element.classList.contains(hiddenClass);
    element.classList.toggle(hiddenClass, !isHidden);
    element.classList.toggle(visibleClass, isHidden);
}

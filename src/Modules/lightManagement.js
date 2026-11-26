import { loadLightData } from './settingsManagement.js';

export function initializeLights(settingsData) {
    const lightData = loadLightData(settingsData);
    lightData.forEach(light => {
        const pane = document.getElementById(`floor-pane-${light.floor}`);
        if (pane) {
            const lightElement = createLightElement(light);
            pane.appendChild(lightElement);
        }
    });
    console.log('Lights initialized.');
}

function createLightElement(light) {
    const lightElement = document.createElement('div');
    lightElement.className = 'light locked';
    lightElement.style.left = light.left;
    lightElement.style.top = light.top;
    lightElement.dataset.level = light.level || 100;
    lightElement.dataset.name = light.name;
    lightElement.dataset.module = light.module;
    lightElement.dataset.channel = light.channel;
    lightElement.dataset.deviceId = light.deviceId;
    lightElement.dataset.id = light.id;

    if (light.isOn) {
        lightElement.classList.add('on');
    }

    return lightElement;
}

// Add the missing function `addLightToCurrentFloor`
export function addLightToCurrentFloor() {
    const currentFloor = getCurrentFloor();
    const pane = document.getElementById(`floor-pane-${currentFloor}`);
    if (pane) {
        const lightElement = createLightElement({
            left: '10%',
            top: '10%',
            isOn: false,
            level: 100,
            name: 'New Light',
            module: '000',
            channel: '000',
            id: 'new',
            deviceId: '000'
        });
        pane.appendChild(lightElement);
        console.log('Added new light to the current floor pane.');
    } else {
        console.error('Current floor pane not found.');
    }
}

function getCurrentFloor() {
    const activeButton = document.querySelector('#floor-buttons-container button.active');
    return activeButton ? parseInt(activeButton.textContent.split(' ')[1], 10) : 1;
}

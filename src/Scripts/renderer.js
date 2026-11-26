import { initializeFloors } from '../Modules/floorManagement.js';
import { initializeLights } from '../Modules/lightManagement.js';
import { addEventListeners } from '../Modules/eventListeners.js';
import { populateSettingsForm } from '../Modules/settingsManagement.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const settingsData = await window.myAPI.initializeSettings();

        if (!settingsData) {
            throw new Error('Failed to load settings data. Settings data is empty.');
        }

        initializeFloors(settingsData);
        initializeLights(settingsData);
        const { ipAddress } = populateSettingsForm(settingsData);
        addEventListeners();

        if (ipAddress) {
            window.myAPI.setIpAddress(ipAddress);
        }

        // Add event listeners to light elements after initialization
        const lightElements = document.querySelectorAll('.light');
        lightElements.forEach(light => {
            addDragEventListenersToLight(light);
        });

        console.log("Application initialized successfully.");
    } catch (error) {
        console.error("Error initializing application:", error);
    }
});

// Function to add drag-and-drop listeners to a light element
function addDragEventListenersToLight(light) {
    // Add event listener for dragging the light element
    light.addEventListener('mousedown', (event) => {
        if (event.button !== 0) return;
        if (light.classList.contains('locked')) return;
        event.preventDefault();
        const shiftX = event.clientX - light.getBoundingClientRect().left;
        const shiftY = event.clientY - light.getBoundingClientRect().top;

        function moveAt(pageX, pageY) {
            light.style.left = ((pageX - shiftX) / light.parentElement.clientWidth) * 100 + '%';
            light.style.top = ((pageY - shiftY) / light.parentElement.clientHeight) * 100 + '%';
        }

        function onMouseMove(event) {
            moveAt(event.pageX, event.pageY);
        }

        document.addEventListener('mousemove', onMouseMove);

        document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', onMouseMove);
            const id = light.dataset.id;
            const newX = parseFloat(light.style.left).toFixed(4);
            const newY = parseFloat(light.style.top).toFixed(4);
            window.myAPI.saveLightPosition(id, newX, newY);
        }, { once: true });
    });

    // Additional event listener for mouse over to request the current light level
    light.addEventListener('mouseover', () => {
        const { module, deviceId, channel } = light.dataset;
        const command = `?CHANLEVELX,${module},${deviceId},${channel};`;
        console.log(`Requesting light level: ${command}`);
        window.myAPI.sendTcpCommand(command);
    });
}

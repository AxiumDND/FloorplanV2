import { addLightToCurrentFloor } from './lightManagement.js';

let isLocked = true; // Set the initial state to locked

export function addEventListeners() {
    // Add event listener for adding a new light
    document.getElementById('add-light-btn').addEventListener('click', () => {
        addLightToCurrentFloor();
    });

    // Event listener for minimizing the header
    document.getElementById('header-minimise-btn').addEventListener('click', () => {
        const headerBar = document.getElementById('header-bar');
        if (headerBar.classList.contains('header-bar-hidden')) {
            headerBar.classList.remove('header-bar-hidden');
            headerBar.classList.add('header-bar-visible');
        } else {
            headerBar.classList.remove('header-bar-visible');
            headerBar.classList.add('header-bar-hidden');
        }
    });

    // Event listener for editing the footer (show/hide footer bar)
    document.getElementById('footer-edit-btn').addEventListener('click', () => {
        const footerBar = document.getElementById('footer-bar');
        if (footerBar.classList.contains('footer-bar-hidden')) {
            footerBar.classList.remove('footer-bar-hidden');
            footerBar.classList.add('footer-bar-visible');
        } else {
            footerBar.classList.remove('footer-bar-visible');
            footerBar.classList.add('footer-bar-hidden');
        }
    });

    // Event listener for opening the settings page
    document.getElementById('open-settings-btn').addEventListener('click', () => {
        console.log('Open settings button clicked');
        const settingsPage = document.getElementById('settings-page');
        if (settingsPage) {
            settingsPage.classList.remove('hidden');
        } else {
            console.error('Settings page element not found.');
        }
    });

    // Event listener for closing the settings page
    document.getElementById('close-settings-btn').addEventListener('click', () => {
        const settingsPage = document.getElementById('settings-page');
        if (settingsPage) {
            settingsPage.classList.add('hidden');
        } else {
            console.error('Settings page element not found.');
        }
    });

    // Save IP/username/password and reconnect TCP
    document.getElementById('saveSettingsButton').addEventListener('click', async () => {
        const ip = document.getElementById('ip-address').value.trim();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const result = await window.myAPI.saveGeneralSettings('userData/settings.csv', ip, username, password);
        if (result && result.success) {
            console.log('General settings saved.');
            if (ip) window.myAPI.setIpAddress(ip);
        } else {
            console.error('Failed to save general settings:', result && result.error);
        }
    });

    // Save number of floors and per-floor names
    document.getElementById('save-floor-names-btn').addEventListener('click', async () => {
        const numFloors = parseInt(document.getElementById('number-of-Floors').value, 10);
        const floorNames = [];
        for (let i = 1; i <= numFloors; i++) {
            const input = document.getElementById(`floor-name-${i}`);
            floorNames.push(input ? input.value : `Floor ${i}`);
        }

        const result = await window.myAPI.saveSettingsToFile('userData/settings.csv', numFloors, floorNames);
        if (result && result.success) {
            console.log('Floor names saved.');
        } else {
            console.error('Failed to save floor names:', result && result.error);
        }
    });

    // Event listener for lock/unlock button
    document.getElementById('lockButton').addEventListener('click', () => {
        isLocked = !isLocked; // Toggle the state
        const lockButton = document.getElementById('lockButton');

        if (lockButton) {
            lockButton.textContent = isLocked ? 'Lock' : 'Unlock';
            console.log(`Lights are now ${isLocked ? 'locked' : 'unlocked'}.`);
        } else {
            console.error('Lock button element not found.');
        }

        // Update the drag state of lights
        const lightElements = document.querySelectorAll('.light');
        lightElements.forEach(light => {
            if (isLocked) {
                light.classList.add('locked');
            } else {
                light.classList.remove('locked');
            }
        });
    });

    console.log('Event listeners added.');
}

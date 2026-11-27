import { initializeFloors } from '../Modules/floorManagement.js';
import { initializeLights, bindLightEditor, bindChannelFeedback } from '../Modules/lightManagement.js';
import { addEventListeners } from '../Modules/eventListeners.js';
import { populateSettingsForm } from '../Modules/settingsManagement.js';
import { showConnectionStatus } from '../Modules/connectionStatus.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const result = await window.myAPI.initializeSettings();
        if (!result.success || !result.data) {
            throw new Error(result.error || 'Settings data is empty.');
        }

        const settingsData = result.data;
        initializeFloors(settingsData);
        initializeLights(settingsData);
        populateSettingsForm(settingsData);
        addEventListeners();
        bindLightEditor();
        bindChannelFeedback();

        window.myAPI.onConnectionStatus(showConnectionStatus);
        const status = await window.myAPI.getConnectionStatus();
        if (status.success) {
            showConnectionStatus(status.data);
        }

        window.myAPI.onTcpMessage((message) => {
            document.dispatchEvent(new CustomEvent('tcp-message', { detail: message }));
        });
    } catch (error) {
        console.error('Error initializing application:', error);
    }
});

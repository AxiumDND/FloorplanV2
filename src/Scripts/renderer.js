import { initializeFloors } from '../Modules/floorManagement.js';
import { initializeLights, bindLightEditor, bindChannelFeedback } from '../Modules/lightManagement.js';
import { initializeSceneButtons, bindSceneEditor, bindSceneFeedback } from '../Modules/sceneManagement.js';
import { initializePageButtons, bindPageEditor } from '../Modules/pageManagement.js';
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
        initializeSceneButtons(settingsData);
        initializePageButtons(settingsData);
        populateSettingsForm(settingsData);
        addEventListeners();
        bindLightEditor();
        bindChannelFeedback();
        bindSceneEditor();
        bindSceneFeedback();
        bindPageEditor();

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
        showConnectionStatus({ state: 'error', message: error.message });
    }
});

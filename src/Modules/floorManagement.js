import { parseFloorsFromSettings, parseFloorNamesFromSettings } from './settingsManagement.js';

export function initializeFloors(settingsData) {
    const numFloors = parseFloorsFromSettings(settingsData);
    const floorNames = parseFloorNamesFromSettings(settingsData, numFloors);

    updateFloorNames(numFloors, floorNames);
    updateFloorButtons(floorNames);
    loadFloorPaneBackgrounds(numFloors);
    console.log('Floors initialized.');
}

function updateFloorNames(numFloors, floorNames) {
    const floorNamesContainer = document.getElementById('floor-names-container');
    floorNamesContainer.innerHTML = '';

    for (let i = 1; i <= numFloors; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Floor ${i} Name`;
        input.value = floorNames[i - 1];
        input.id = `floor-name-${i}`;
        input.className = 'floor-name-input';
        floorNamesContainer.appendChild(input);
    }
}

function updateFloorButtons(floorNames) {
    const header = document.getElementById('floor-buttons-container');
    header.innerHTML = '';

    floorNames.forEach((floorName, index) => {
        const button = document.createElement('button');
        button.textContent = floorName;
        button.addEventListener('click', () => {
            console.log(`${floorName} button clicked`);
            showFloorPane(index + 1);
            setActiveButton(button);
        });
        header.appendChild(button);
    });
}

function loadFloorPaneBackgrounds(numFloors) {
    for (let i = 1; i <= numFloors; i++) {
        const floorPane = document.getElementById(`floor-pane-${i}`);
        if (floorPane) {
            floorPane.style.backgroundImage = `url('userData/floor-${i}-image.png?timestamp=${new Date().getTime()}')`;
            floorPane.style.backgroundSize = 'contain';
            floorPane.style.backgroundPosition = 'center';
            floorPane.style.backgroundRepeat = 'no-repeat';
        }
    }
}

function showFloorPane(floorNumber) {
    const floorPanes = document.querySelectorAll('.floor-pane');
    floorPanes.forEach(pane => {
        pane.style.display = 'none';
    });

    const selectedPane = document.getElementById(`floor-pane-${floorNumber}`);
    if (selectedPane) {
        selectedPane.style.display = 'block';
    }
}

function setActiveButton(button) {
    const buttons = document.querySelectorAll('#floor-buttons-container button');
    buttons.forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
}

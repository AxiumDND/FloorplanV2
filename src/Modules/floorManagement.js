import { parseFloorsFromSettings, parseFloorNamesFromSettings } from './settingsManagement.js';

export function floorImageUrl(floorNumber) {
    return `floorplan://image/floor-${floorNumber}-image.png?t=${Date.now()}`;
}

export function getCurrentFloor() {
    const activeButton = document.querySelector('#floor-buttons-container button.active');
    const floor = activeButton ? parseInt(activeButton.dataset.floor, 10) : 1;
    return Number.isInteger(floor) ? floor : 1;
}

export function getFloorNames() {
    return [...document.querySelectorAll('#floor-buttons-container button')].map((button) => button.textContent);
}

export function goToFloor(floorNumber) {
    const button = document.querySelector(`#floor-buttons-container button[data-floor="${floorNumber}"]`);
    if (!button) {
        return false;
    }
    showFloorPane(floorNumber);
    setActiveButton(button);
    return true;
}

export function initializeFloors(settingsData) {
    const numFloors = parseFloorsFromSettings(settingsData);
    const floorNames = parseFloorNamesFromSettings(settingsData, numFloors);
    renderFloors(numFloors, floorNames);
}

export function renderFloors(numFloors, floorNames) {
    updateFloorNameInputs(numFloors, floorNames);
    updateFloorButtons(floorNames);
    for (let i = 1; i <= numFloors; i++) {
        setFloorBackground(i);
    }
}

export function updateFloorNameInputs(numFloors, floorNames) {
    const floorNamesContainer = document.getElementById('floor-names-container');
    const previous = [];
    for (let i = 1; i <= 6; i++) {
        const existing = document.getElementById(`floor-name-${i}`);
        previous.push(existing ? existing.value : '');
    }

    floorNamesContainer.innerHTML = '';
    for (let i = 1; i <= numFloors; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Floor ${i} Name`;
        input.value = (floorNames && floorNames[i - 1]) || previous[i - 1] || `Floor ${i}`;
        input.id = `floor-name-${i}`;
        input.className = 'floor-name-input';
        floorNamesContainer.appendChild(input);
    }
}

export function setFloorBackground(floorNumber) {
    const floorPane = document.getElementById(`floor-pane-${floorNumber}`);
    if (!floorPane) {
        return;
    }
    floorPane.style.backgroundImage = `url('${floorImageUrl(floorNumber)}')`;
    floorPane.style.backgroundSize = 'contain';
    floorPane.style.backgroundPosition = 'center';
    floorPane.style.backgroundRepeat = 'no-repeat';
}

function updateFloorButtons(floorNames) {
    const header = document.getElementById('floor-buttons-container');
    header.innerHTML = '';

    floorNames.forEach((floorName, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = floorName;
        button.dataset.floor = String(index + 1);
        button.addEventListener('click', () => {
            showFloorPane(index + 1);
            setActiveButton(button);
        });
        header.appendChild(button);
    });

    const firstButton = header.querySelector('button');
    if (firstButton) {
        setActiveButton(firstButton);
        showFloorPane(1);
    }
}

function showFloorPane(floorNumber) {
    document.querySelectorAll('.floor-pane').forEach((pane) => {
        pane.style.display = 'none';
    });

    const selectedPane = document.getElementById(`floor-pane-${floorNumber}`);
    if (selectedPane) {
        selectedPane.style.display = 'block';
    }
}

function setActiveButton(button) {
    document.querySelectorAll('#floor-buttons-container button').forEach((btn) => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
}

import { loadPageButtonData } from './settingsManagement.js';
import { getCurrentFloor, getFloorNames, goToFloor } from './floorManagement.js';
import { describeTarget, targetPage } from './pageButton.js';

let editingButton = null;

export function initializePageButtons(settingsData) {
    loadPageButtonData(settingsData).forEach((button) => {
        const pane = document.getElementById(`floor-pane-${button.floor}`);
        if (!pane) {
            return;
        }
        const element = createPageElement(button);
        pane.appendChild(element);
        attachPageInteractions(element);
    });
}

export async function addPageButtonToCurrentFloor() {
    const floor = getCurrentFloor();
    const pane = document.getElementById(`floor-pane-${floor}`);
    if (!pane) {
        console.error('Current floor pane not found.');
        return;
    }

    const element = createPageElement({
        id: nextPageId(),
        floor,
        left: '20%',
        top: '20%',
        name: 'New Page',
        target: '0',
    });
    if (document.body.dataset.lightsLocked === 'false') {
        element.classList.remove('locked');
    }
    pane.appendChild(element);
    attachPageInteractions(element);
    await persistPage(element);
}

// Floor names or the number of floors may have changed in settings.
export function refreshPageButtons() {
    document.querySelectorAll('.page-button').forEach(refreshPageDisplay);
}

export function bindPageEditor() {
    document.getElementById('save-page-button').addEventListener('click', async () => {
        if (!editingButton) {
            return;
        }

        editingButton.dataset.name = fieldValue('edit-page-name', 'New Page');
        editingButton.dataset.target = document.getElementById('edit-page-target').value || '0';
        refreshPageDisplay(editingButton);

        if (await persistPage(editingButton)) {
            closePageEditor();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closePageEditor();
        }
    });
}

function refreshPageDisplay(button) {
    const names = getFloorNames();
    const assigned = targetPage(button.dataset, names.length) !== null;
    button.classList.toggle('unassigned', !assigned);
    button.querySelector('.page-button-name').textContent = button.dataset.name;
    button.title = `${button.dataset.name} - ${describeTarget(button.dataset, names)}`;
}

function openTarget(button) {
    const page = targetPage(button.dataset, getFloorNames().length);
    if (page !== null) {
        goToFloor(page);
    }
}

function createPageElement(button) {
    const element = document.createElement('div');
    element.className = 'page-button locked';
    element.style.left = button.left;
    element.style.top = button.top;
    element.dataset.id = String(button.id);
    element.dataset.floor = String(button.floor);
    element.dataset.name = button.name;
    element.dataset.target = button.target;

    const label = document.createElement('span');
    label.className = 'page-button-name';
    element.appendChild(label);
    refreshPageDisplay(element);
    return element;
}

function attachPageInteractions(button) {
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
            persistPage(button);
        }, { once: true });
    });

    // A locked plan is for using the buttons; unlock to move or edit them.
    button.addEventListener('click', () => {
        if (button.classList.contains('locked')) {
            openTarget(button);
        }
    });

    button.addEventListener('dblclick', (event) => {
        event.stopPropagation();
        if (!button.classList.contains('locked')) {
            openPageEditor(button);
        }
    });
}

function fillTargetOptions(selected) {
    const select = document.getElementById('edit-page-target');
    select.innerHTML = '';

    const none = document.createElement('option');
    none.value = '0';
    none.textContent = '(none)';
    select.appendChild(none);

    getFloorNames().forEach((name, index) => {
        const option = document.createElement('option');
        option.value = String(index + 1);
        option.textContent = name;
        select.appendChild(option);
    });

    const valid = targetPage({ target: selected }, getFloorNames().length) !== null;
    select.value = valid ? String(Number(selected)) : '0';
}

function openPageEditor(button) {
    editingButton = button;
    document.getElementById('edit-page-name').value = button.dataset.name || '';
    fillTargetOptions(button.dataset.target);
    document.getElementById('edit-page-error').textContent = '';

    const menu = document.getElementById('pageeditmenu');
    const rect = button.getBoundingClientRect();
    menu.style.left = `${Math.min(rect.right + 8, window.innerWidth - 220)}px`;
    menu.style.top = `${Math.max(rect.top, 8)}px`;
    menu.classList.remove('hidden');
}

function closePageEditor() {
    document.getElementById('pageeditmenu').classList.add('hidden');
    editingButton = null;
}

function pageRecord(button) {
    return {
        id: Number(button.dataset.id),
        floor: Number(button.dataset.floor),
        x: parseFloat(button.style.left),
        y: parseFloat(button.style.top),
        name: button.dataset.name,
        target: button.dataset.target,
    };
}

async function persistPage(button) {
    const result = await window.myAPI.savePageButton(pageRecord(button));
    if (!result.success) {
        console.error('Failed to save page button:', result.error);
        const error = document.getElementById('edit-page-error');
        if (error) {
            error.textContent = 'Could not save this button.';
        }
    }
    return result.success;
}

function nextPageId() {
    const ids = [...document.querySelectorAll('.page-button')]
        .map((button) => parseInt(button.dataset.id, 10))
        .filter((id) => Number.isInteger(id));
    return ids.length ? Math.max(...ids) + 1 : 1;
}

function fieldValue(id, fallback) {
    const value = document.getElementById(id).value.trim();
    return value || fallback;
}

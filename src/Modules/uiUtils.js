export function updateSliderBackground(slider) {
    const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
    slider.style.background = `linear-gradient(to right, #ffec00 ${value}%, #ddd ${value}%)`;
}

export function setActiveButton(button) {
    const buttons = document.querySelectorAll('#floor-buttons-container button');
    buttons.forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
}

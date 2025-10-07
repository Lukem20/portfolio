"use strict";

const slider = document.querySelector('[data-slider]');
const prevButton = document.querySelector('[data-prev]');
const nextButton = document.querySelector('[data-next]');

prevButton.addEventListener('click', () => slide('prev'));
nextButton.addEventListener('click', () => slide('next'));
slider.addEventListener('scroll', () => {
    updateButtonsVisibility();
});

function slide(direction) {
    const { scrollLeft, clientWidth } = slider;
    const left = direction === 'prev' ? scrollLeft - clientWidth : scrollLeft + clientWidth;

    slider.scroll({ left, behavior: 'smooth' });
}

function updateButtonsVisibility() {
    const { scrollLeft, clientWidth, scrollWidth } = slider;

    prevButton.style.opacity = scrollLeft === 0 ? '0' : '1';
    prevButton.style.pointerEvents = scrollLeft === 0 ? 'none' : 'auto';

    nextButton.style.opacity = scrollLeft + clientWidth >= scrollWidth -2 ? '0' : '1';
    nextButton.style.pointerEvents = scrollLeft + clientWidth >= scrollWidth -2 ? 'none' : 'auto';
}

updateButtonsVisibility();
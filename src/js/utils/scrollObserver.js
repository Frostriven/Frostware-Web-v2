/**
 * Scroll Observer Utility
 * Handles visibility animations for elements entering the viewport.
 */

export const initScrollObserver = () => {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            // Bidirectional animation: add 'visible' when in view, remove when out
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // We DO NOT unobserve anymore to allow re-triggering when scrolling back
            } else {
                // Optional: Check if we want to remove the class to re-animate when scrolling back
                // This creates the "fluidity" requested by the user
                entry.target.classList.remove('visible');
            }
        });
    }, observerOptions);

    // Function to observe elements
    const observeElements = () => {
        // Select all elements with fade-in classes
        const elements = document.querySelectorAll('.fade-in-up, .fade-in-down, .fade-in-left, .fade-in-right, .fade-in-scale');

        elements.forEach(el => {
            // Observe everything. IntersectionObserver handles duplicates automatically.
            observer.observe(el);
        });
    };

    // Initial observation
    observeElements();

    // Export a method to re-run observation (useful for SPA navigation and dynamic content)
    return {
        refresh: observeElements
    };
};

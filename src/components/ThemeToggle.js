/**
 * Theme Toggle Component
 * Beautiful celestial-themed toggle with sun/moon animation
 */

/**
 * Creates the HTML for the theme toggle button (iOS-style switch)
 * @param {boolean} isDark - Current theme state
 * @returns {string} HTML string for the toggle
 */
export function createThemeToggleHTML(isDark = false) {
  return `
    <button
      id="theme-toggle"
      class="flex items-center justify-between w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
      aria-label="Toggle dark mode"
      title="${isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}"
    >
      <div class="flex items-center gap-3">
        <!-- Icon that changes based on theme -->
        <div class="relative w-5 h-5 flex items-center justify-center">
          <!-- Sun Icon (visible in light mode) -->
          <svg
            class="sun-icon w-5 h-5 absolute transition-all duration-300 ${!isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'}"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
          </svg>

          <!-- Moon Icon (visible in dark mode) -->
          <svg
            class="moon-icon w-5 h-5 absolute transition-all duration-300 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </div>

        <span class="font-medium text-sm">Modo Oscuro</span>
      </div>

      <!-- iOS-style Toggle Switch -->
      <div class="ios-switch-container ml-auto">
        <div class="ios-switch ${isDark ? 'active' : ''}" data-theme-switch>
          <div class="ios-switch-track ${isDark ? 'active' : ''}">
            <div class="ios-switch-thumb ${isDark ? 'active' : ''}">
              <!-- Mini sun icon inside thumb (light mode) -->
              <svg class="thumb-icon sun ${!isDark ? 'visible' : ''}" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
              </svg>
              <!-- Mini moon icon inside thumb (dark mode) -->
              <svg class="thumb-icon moon ${isDark ? 'visible' : ''}" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </button>
  `;
}

/**
 * Creates inline styles for the theme toggle
 * @returns {string} CSS styles
 */
export function getThemeToggleStyles() {
  return `
    <style>
      /* iOS-Style Toggle Switch */
      .ios-switch-container {
        display: inline-flex;
        align-items: center;
      }

      .ios-switch {
        position: relative;
        display: inline-block;
        width: 48px;
        height: 26px;
        cursor: pointer;
      }

      .ios-switch-track {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #d1d5db;
        border-radius: 13px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .ios-switch-track.active {
        background: linear-gradient(135deg, #22a7d0 0%, #1e96bc 100%);
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 0 12px rgba(34, 167, 208, 0.3);
      }

      .ios-switch-thumb {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 22px;
        height: 22px;
        background-color: white;
        border-radius: 50%;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .ios-switch-thumb.active {
        transform: translateX(22px);
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.15);
      }

      /* Thumb icon styles */
      .thumb-icon {
        width: 12px;
        height: 12px;
        position: absolute;
        transition: opacity 0.2s, transform 0.2s;
        opacity: 0;
        transform: scale(0.8);
      }

      .thumb-icon.visible {
        opacity: 1;
        transform: scale(1);
      }

      .thumb-icon.sun {
        color: #f59e0b;
      }

      .thumb-icon.moon {
        color: #6366f1;
      }

      /* Hover effects */
      #theme-toggle:hover .ios-switch-track {
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15), 0 0 0 2px rgba(34, 167, 208, 0.1);
      }

      #theme-toggle:hover .ios-switch-track.active {
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 0 16px rgba(34, 167, 208, 0.4);
      }

      #theme-toggle:hover .ios-switch-thumb {
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.15);
      }

      /* Icon next to label */
      #theme-toggle .sun-icon,
      #theme-toggle .moon-icon {
        transform-origin: center;
      }

      #theme-toggle:hover .sun-icon {
        color: #f59e0b;
      }

      #theme-toggle:hover .moon-icon {
        color: #6366f1;
      }

      /* Active state */
      #theme-toggle:active .ios-switch {
        transform: scale(0.95);
      }

      /* Stars animation for theme transition */
      @keyframes twinkle {
        0%, 100% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.2); }
      }

      html.theme-transitioning::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
        background: radial-gradient(2px 2px at 20% 30%, white, transparent),
                    radial-gradient(2px 2px at 60% 70%, white, transparent),
                    radial-gradient(1px 1px at 50% 50%, white, transparent),
                    radial-gradient(1px 1px at 80% 10%, white, transparent),
                    radial-gradient(2px 2px at 90% 60%, white, transparent),
                    radial-gradient(1px 1px at 30% 80%, white, transparent);
        animation: twinkle 0.5s ease-in-out;
        opacity: 0;
      }

      html.dark.theme-transitioning::before {
        opacity: 0.6;
      }

      /* Dark mode adjustments */
      html.dark .ios-switch-track {
        background-color: #4b5563;
      }
    </style>
  `;
}

/**
 * Binds event listeners to the theme toggle button
 * @param {Object} themeManager - Theme manager instance
 */
export function bindThemeToggleEvents(themeManager) {
  const toggleButton = document.getElementById('theme-toggle');

  if (!toggleButton) {
    console.warn('Theme toggle button not found');
    return;
  }

  toggleButton.addEventListener('click', () => {
    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    // Toggle theme
    themeManager.toggleTheme();

    // Update button state
    updateThemeToggleUI(themeManager.isDarkMode());

    // Show toast notification (if cart toast is available)
    if (window.cart && window.cart.showToast) {
      const message = themeManager.isDarkMode()
        ? '🌙 Modo oscuro activado'
        : '☀️ Modo claro activado';
      window.cart.showToast(message, 'success');
    }
  });

  // Listen for theme changes from other sources
  window.addEventListener('themeChanged', (e) => {
    updateThemeToggleUI(e.detail.theme === 'dark');
  });
}

/**
 * Updates the theme toggle UI to reflect current state
 * @param {boolean} isDark - Whether dark mode is active
 */
export function updateThemeToggleUI(isDark) {
  const toggleButton = document.getElementById('theme-toggle');
  if (!toggleButton) return;

  // Update main icon visibility (next to label)
  const sunIcon = toggleButton.querySelector('.sun-icon');
  const moonIcon = toggleButton.querySelector('.moon-icon');

  if (sunIcon && moonIcon) {
    if (isDark) {
      moonIcon.classList.remove('opacity-0', '-rotate-90', 'scale-0');
      moonIcon.classList.add('opacity-100', 'rotate-0', 'scale-100');
      sunIcon.classList.remove('opacity-100', 'rotate-0', 'scale-100');
      sunIcon.classList.add('opacity-0', 'rotate-90', 'scale-0');
    } else {
      sunIcon.classList.remove('opacity-0', 'rotate-90', 'scale-0');
      sunIcon.classList.add('opacity-100', 'rotate-0', 'scale-100');
      moonIcon.classList.remove('opacity-100', 'rotate-0', 'scale-100');
      moonIcon.classList.add('opacity-0', '-rotate-90', 'scale-0');
    }
  }

  // Update iOS switch state
  const switchTrack = toggleButton.querySelector('.ios-switch-track');
  const switchThumb = toggleButton.querySelector('.ios-switch-thumb');
  const thumbSunIcon = toggleButton.querySelector('.thumb-icon.sun');
  const thumbMoonIcon = toggleButton.querySelector('.thumb-icon.moon');

  if (switchTrack) {
    if (isDark) {
      switchTrack.classList.add('active');
    } else {
      switchTrack.classList.remove('active');
    }
  }

  if (switchThumb) {
    if (isDark) {
      switchThumb.classList.add('active');
    } else {
      switchThumb.classList.remove('active');
    }
  }

  // Update thumb icons
  if (thumbSunIcon && thumbMoonIcon) {
    if (isDark) {
      thumbMoonIcon.classList.add('visible');
      thumbSunIcon.classList.remove('visible');
    } else {
      thumbSunIcon.classList.add('visible');
      thumbMoonIcon.classList.remove('visible');
    }
  }

  // Update aria-label
  toggleButton.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  toggleButton.setAttribute('title', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
}

/**
 * Initialize theme toggle in the header
 * @param {Object} themeManager - Theme manager instance
 */
export function initializeThemeToggle(themeManager) {
  // Bind events if toggle already exists
  bindThemeToggleEvents(themeManager);

  // Update UI to match current theme
  updateThemeToggleUI(themeManager.isDarkMode());
}

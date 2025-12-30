/**
 * Theme Manager - Sistema de gestión de Dark Mode para Frostware
 * Maneja la persistencia y aplicación del tema en toda la aplicación
 */

class ThemeManager {
  constructor() {
    this.STORAGE_KEY = 'frostware-theme';
    this.THEME_LIGHT = 'light';
    this.THEME_DARK = 'dark';
    this.currentTheme = this.getStoredTheme();

    // Apply theme immediately to prevent flash
    this.applyTheme(this.currentTheme, false);
  }

  /**
   * Get stored theme from localStorage or system preference
   */
  getStoredTheme() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) return stored;

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return this.THEME_DARK;
    }

    return this.THEME_LIGHT;
  }

  /**
   * Apply theme to document
   * @param {string} theme - 'light' or 'dark'
   * @param {boolean} animate - Whether to animate the transition
   */
  applyTheme(theme, animate = true) {
    const html = document.documentElement;

    if (animate) {
      // Add transitioning class for smooth animation
      html.classList.add('theme-transitioning');

      // Remove after animation completes
      setTimeout(() => {
        html.classList.remove('theme-transitioning');
      }, 500);
    }

    if (theme === this.THEME_DARK) {
      html.classList.add('dark');
      html.setAttribute('data-theme', 'dark');
    } else {
      html.classList.remove('dark');
      html.setAttribute('data-theme', 'light');
    }

    this.currentTheme = theme;

    // Dispatch custom event for other components to react
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme: this.currentTheme }
    }));
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const newTheme = this.currentTheme === this.THEME_LIGHT
      ? this.THEME_DARK
      : this.THEME_LIGHT;

    this.setTheme(newTheme);
  }

  /**
   * Set specific theme
   * @param {string} theme - 'light' or 'dark'
   */
  setTheme(theme) {
    if (theme !== this.THEME_LIGHT && theme !== this.THEME_DARK) {
      console.warn(`Invalid theme: ${theme}. Using light theme.`);
      theme = this.THEME_LIGHT;
    }

    localStorage.setItem(this.STORAGE_KEY, theme);
    this.applyTheme(theme, true);
  }

  /**
   * Get current theme
   * @returns {string} Current theme ('light' or 'dark')
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Check if dark mode is active
   * @returns {boolean}
   */
  isDarkMode() {
    return this.currentTheme === this.THEME_DARK;
  }
}

// Create singleton instance
const themeManager = new ThemeManager();

// Export for use in other modules
export default themeManager;
export { ThemeManager };

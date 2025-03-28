// Theme management
class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.themeIcon = this.themeToggle.querySelector('.theme-icon');
        this.init();
    }

    async init() {
        // Load saved theme
        const theme = await window.electronAPI.getTheme();
        this.applyTheme(theme);

        // Set up event listener
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    async toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        await window.electronAPI.setTheme(newTheme);
        this.applyTheme(newTheme);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        
        // Dispatch event for other components that need to react to theme changes
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    }
}

// Initialize theme management
const themeManager = new ThemeManager(); 
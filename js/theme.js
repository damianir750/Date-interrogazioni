import { createIcons, icons } from 'lucide';

// Theme Toggle Logic
const themeToggle = {
    init() {
        // Check local storage or system preference
        const savedTheme = localStorage.theme;
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!('theme' in localStorage) && systemDark)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Add toggle button listener if it exists
        const btn = document.getElementById('themeToggleBtn');
        if (btn) {
            btn.addEventListener('click', () => this.toggle());
            this.updateIcon();
        }
    },

    toggle() {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        } else {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        }
        this.updateIcon();
    },

    updateIcon() {
        const btn = document.getElementById('themeToggleBtn');
        if (!btn) return;

        const isDark = document.documentElement.classList.contains('dark');
        btn.innerHTML = isDark
            ? '<i data-lucide="sun" class="w-5 h-5 text-yellow-400"></i>'
            : '<i data-lucide="moon" class="w-5 h-5 text-gray-600"></i>';
        createIcons({ icons });
    }
};

// Init on load
window.addEventListener('load', () => {
    // Remove the anti-FOUC hidden style to allow clean theme toggling
    const foucStyle = document.getElementById('fouc-style');
    if (foucStyle) foucStyle.remove();

    themeToggle.init();
});

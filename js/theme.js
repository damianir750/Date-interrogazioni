import { createIcons, icons } from 'lucide';

// Theme Toggle Logic
const themeToggle = {
    init() {
        console.log('[Theme] Init started');
        // Check local storage or system preference
        const savedTheme = localStorage.theme;
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        console.log('[Theme] Detection:', { savedTheme, systemDark });

        if (savedTheme === 'dark' || (!('theme' in localStorage) && systemDark)) {
            console.log('[Theme] Applying initial DARK');
            document.documentElement.classList.add('dark');
        } else {
            console.log('[Theme] Applying initial LIGHT');
            document.documentElement.classList.remove('dark');
        }

        // Add toggle button listener if it exists
        const btn = document.getElementById('themeToggleBtn');
        if (btn) {
            console.log('[Theme] Button found, attaching listener');
            btn.addEventListener('click', () => {
                console.log('[Theme] Button clicked');
                this.toggle();
            });
            this.updateIcon();
        } else {
            console.error('[Theme] Button NOT found!');
        }
    },

    toggle() {
        console.log('[Theme] Toggling...');
        if (document.documentElement.classList.contains('dark')) {
            console.log('[Theme] Switching to LIGHT');
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        } else {
            console.log('[Theme] Switching to DARK');
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        }
        this.updateIcon();
    },

    updateIcon() {
        const btn = document.getElementById('themeToggleBtn');
        if (!btn) return;

        const isDark = document.documentElement.classList.contains('dark');
        console.log('[Theme] Updating icon, isDark:', isDark);
        btn.innerHTML = isDark
            ? '<i data-lucide="sun" class="w-5 h-5 text-yellow-400"></i>'
            : '<i data-lucide="moon" class="w-5 h-5 text-gray-600"></i>';
        createIcons({ icons });
    }
};

// Init on load
window.addEventListener('load', () => {
    console.log('[Theme] Window load event fired');

    // Remove the anti-FOUC hidden style to allow clean theme toggling
    const foucStyle = document.getElementById('fouc-style');
    if (foucStyle) {
        console.log('[Theme] Removing FOUC style element');
        foucStyle.remove();
    } else {
        console.warn('[Theme] FOUC style element NOT found');
    }

    themeToggle.init();
});

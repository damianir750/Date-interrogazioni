// Theme Toggle Logic
const themeToggle = {
    init() {
        // Check local storage or system preference
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
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
        lucide.createIcons();
    }
};

// Init on load
document.addEventListener('DOMContentLoaded', () => {
    themeToggle.init();
});

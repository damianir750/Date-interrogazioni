import {
    createIcons,
    Sun,
    Moon,
    Home,
    ArrowRight,
    ArrowLeft,
    FolderArchive,
    HardDrive,
    ExternalLink,
    Calendar,
    GraduationCap,
    PlusCircle,
    Search,
    Settings,
    X,
    BookOpen,
    Eye,
    Palette,
    Check
} from 'lucide';

const icons = {
    Sun,
    Moon,
    Home,
    ArrowRight,
    ArrowLeft,
    FolderArchive,
    HardDrive,
    ExternalLink,
    Calendar,
    GraduationCap,
    PlusCircle,
    Search,
    Settings,
    X,
    BookOpen,
    Eye,
    Palette,
    Check
};

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

// Accessibility Toggle Logic
const a11yToggle = {
    init() {
        const isDyslexic = localStorage.dyslexic === 'true';
        if (isDyslexic) {
            document.documentElement.classList.add('dyslexic-mode');
        }

        const btn = document.getElementById('dyslexiaToggleBtn');
        if (btn) {
            btn.addEventListener('click', () => this.toggle());
            this.updateStyle(btn, isDyslexic);
        }
    },

    toggle() {
        const isActive = document.documentElement.classList.toggle('dyslexic-mode');
        localStorage.dyslexic = isActive;

        const btn = document.getElementById('dyslexiaToggleBtn');
        if (btn) this.updateStyle(btn, isActive);
    },

    updateStyle(btn, isActive) {
        if (isActive) {
            btn.classList.add('bg-blue-100', 'text-blue-700', 'dark:bg-blue-900', 'dark:text-blue-300');
            btn.classList.remove('text-gray-700', 'dark:text-gray-200');
        } else {
            btn.classList.remove('bg-blue-100', 'text-blue-700', 'dark:bg-blue-900', 'dark:text-blue-300');
            btn.classList.add('text-gray-700', 'dark:text-gray-200');
        }
    }
};

// Background Theme Logic
const bgToggle = {
    themes: ['default', 'ocean', 'sunset', 'nebula'],

    init() {
        const savedBg = localStorage.bg_theme || 'default';
        this.applyTheme(savedBg);

        const btn = document.getElementById('bgToggleBtn');
        if (btn) {
            btn.addEventListener('click', () => this.cycle());
        }
    },

    cycle() {
        const currentTheme = localStorage.bg_theme || 'default';
        const currentIndex = this.themes.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        const nextTheme = this.themes[nextIndex];

        this.applyTheme(nextTheme);
    },

    applyTheme(themeName) {
        // Remove all theme classes first
        this.themes.forEach(t => {
            if (t !== 'default') document.body.classList.remove(`theme-${t}`);
        });

        // Add new theme class if not default
        if (themeName !== 'default') {
            document.body.classList.add(`theme-${themeName}`);
        }

        localStorage.bg_theme = themeName;
    }
};

// Init on load
window.addEventListener('load', () => {
    // Remove the anti-FOUC hidden style to allow clean theme toggling
    const foucStyle = document.getElementById('fouc-style');
    if (foucStyle) foucStyle.remove();

    themeToggle.init();
    a11yToggle.init();
    bgToggle.init();

    // Initialize all Lucide icons
    createIcons({ icons });
});

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

        // Reapply theme for the new mode
        if (window.bgToggle) {
            window.bgToggle.applyCurrentTheme();
        }
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
    lightThemes: [
        { id: 'default', name: 'Default', colors: ['#e0e7ff', '#ddd6fe', '#fce7f3'] },
        { id: 'ocean', name: 'Ocean', colors: ['#e0f2fe', '#bae6fd', '#7dd3fc'] },
        { id: 'sunset', name: 'Sunset', colors: ['#fed7aa', '#fdba74', '#fb923c'] },
        { id: 'forest', name: 'Forest', colors: ['#d1fae5', '#a7f3d0', '#6ee7b7'] },
        { id: 'lavender', name: 'Lavender', colors: ['#f3e8ff', '#e9d5ff', '#d8b4fe'] }
    ],
    darkThemes: [
        { id: 'default', name: 'Default', colors: ['#0f172a', '#4c1d95', '#1e293b'] },
        { id: 'midnight', name: 'Midnight', colors: ['#0f172a', '#1e1b4b', '#312e81'] },
        { id: 'abyss', name: 'Abyss', colors: ['#0c4a6e', '#075985', '#0369a1'] },
        { id: 'ember', name: 'Ember', colors: ['#7c2d12', '#9a3412', '#c2410c'] },
        { id: 'nebula', name: 'Nebula', colors: ['#4c1d95', '#6b21a8', '#7e22ce'] }
    ],

    init() {
        const savedBg = localStorage.bg_theme || 'default';
        this.applyTheme(savedBg);

        const btn = document.getElementById('bgToggleBtn');
        if (btn) {
            btn.addEventListener('click', () => this.openModal());
        }
    },

    openModal() {
        const isDark = document.documentElement.classList.contains('dark');
        const themes = isDark ? this.darkThemes : this.lightThemes;
        const currentTheme = localStorage.bg_theme || 'default';

        const modal = document.createElement('div');
        modal.id = 'themeModal';
        modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 animate-enter">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-bold text-gray-800 dark:text-white">Scegli Tema ${isDark ? 'Scuro' : 'Chiaro'}</h3>
                    <button onclick="document.getElementById('themeModal').remove()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    ${themes.map(theme => `
                        <button onclick="window.bgToggle.selectTheme('${theme.id}')" 
                            class="group relative p-4 rounded-xl border-2 transition-all hover:scale-105 ${currentTheme === theme.id ? 'border-purple-500 shadow-lg ring-2 ring-purple-200 dark:ring-purple-800' : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'}"
                        >
                            <div class="h-16 rounded-lg mb-2 overflow-hidden shadow-inner" style="background: linear-gradient(135deg, ${theme.colors.join(', ')})"></div>
                            <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">${theme.name}</p>
                            ${currentTheme === theme.id ? '<div class="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shadow-lg"><i data-lucide="check" class="w-3 h-3 text-white"></i></div>' : ''}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        createIcons({ icons });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    selectTheme(themeId) {
        this.applyTheme(themeId);
        document.getElementById('themeModal')?.remove();
    },

    applyTheme(themeName) {
        const allThemes = [...this.lightThemes, ...this.darkThemes].map(t => t.id);

        // Remove all theme classes
        allThemes.forEach(t => {
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

// Expose bgToggle globally for onclick handlers
window.bgToggle = bgToggle;

/**
 * Utility functions for Date Interrogazioni App
 */

export const utils = {
    // Formatta data (YYYY-MM-DD -> DD/MM/YYYY)
    formatDate(dateString) {
        if (dateString === '9999-12-31') return 'DATA MANCANTE';
        const d = new Date(dateString);
        return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    },

    // Calcola giorni trascorsi da una data
    daysSince(dateString) {
        if (dateString === '9999-12-31') return -1;

        // Parse "YYYY-MM-DD" manually to treat it as local time
        const [objYear, objMonth, objDay] = dateString.split('-').map(Number);

        // Create date at midnight local time
        const then = new Date(objYear, objMonth - 1, objDay);
        const now = new Date();

        then.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);

        return Math.floor((now - then) / (1000 * 60 * 60 * 24));
    },

    // Convert Hex to RGB object (Memoized)
    _hexToRgbCache: {},
    hexToRgb(hex) {
        if (this._hexToRgbCache[hex]) return this._hexToRgbCache[hex];

        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        const rgb = result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;

        this._hexToRgbCache[hex] = rgb;
        return rgb;
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Darkens a hex color by a percentage (0-1)
    darkenColor(hex, percent = 0.3) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return hex;
        const r = Math.max(0, Math.floor(rgb.r * (1 - percent)));
        const g = Math.max(0, Math.floor(rgb.g * (1 - percent)));
        const b = Math.max(0, Math.floor(rgb.b * (1 - percent)));
        return `rgb(${r}, ${g}, ${b})`;
    },

    // Escape HTML to prevent XSS
    escapeHtml(unsafe) {
        if (unsafe === null || unsafe === undefined) return '';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/`/g, "&#96;"); // Backticks can sometimes be used for XSS
    },

    // Escape for HTML attributes (like onclick)
    escapeAttribute(unsafe) {
        if (unsafe === null || unsafe === undefined) return '';
        // For attributes, we mainly need to worry about quotes breaking out
        return String(unsafe)
            .replace(/"/g, "&quot;")
            .replace(/'/g, "\\'") // Escaping for JS string inside attribute
            .replace(/\n/g, " "); // No newlines in attributes
    }
};

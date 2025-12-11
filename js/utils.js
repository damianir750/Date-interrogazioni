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
        const then = new Date(dateString);
        const now = new Date();
        then.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        return Math.floor((now - then) / (1000 * 60 * 60 * 24));
    },

    // Convert Hex to RGB object
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
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
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};

/**
 * Utility functions for Date Interrogazioni App
 */

export const utils = {
    // Normalizza data da DB a YYYY-MM-DD
    normalizeDate(dateString) {
        if (!dateString || dateString === '9999-12-31') return dateString;
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    // Formatta data (YYYY-MM-DD -> DD/MM/YYYY)
    formatDate(dateString) {
        if (!dateString || dateString === '9999-12-31') return 'DATA MANCANTE';

        // Handle Date objects
        let d;
        if (dateString instanceof Date) {
            d = dateString;
        } else {
            d = new Date(dateString);
        }

        if (isNaN(d.getTime())) return 'DATA NON VALIDA';
        return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    },

    // Cache for dates
    _daysSinceCache: {},
    // Calcola giorni trascorsi da una data (Memoized)
    daysSince(dateString) {
        // Handle null, undefined, empty string
        if (!dateString || dateString === '9999-12-31') return -1;

        // Convert Date object to string if needed
        let cacheKey = dateString;
        if (dateString instanceof Date) {
            const year = dateString.getFullYear();
            const month = String(dateString.getMonth() + 1).padStart(2, '0');
            const day = String(dateString.getDate()).padStart(2, '0');
            cacheKey = `${year}-${month}-${day}`;
        } else {
            cacheKey = String(dateString);
        }

        // Cache the result for today (clears at midnight naturally if page refreshed, else it's slightly stale till refresh but OK for an active tab)
        // For a more precise logic we could salt the cacheKey with today's date
        const todayKey = new Date().toDateString();
        const fullKey = `${cacheKey}_${todayKey}`;

        if (this._daysSinceCache[fullKey] !== undefined) {
            return this._daysSinceCache[fullKey];
        }

        // Parse "YYYY-MM-DD" manually to treat it as local time
        const parts = cacheKey.split('-');
        if (parts.length !== 3) return -1;

        const [objYear, objMonth, objDay] = parts.map(Number);
        if (isNaN(objYear) || isNaN(objMonth) || isNaN(objDay)) return -1;

        const then = new Date(objYear, objMonth - 1, objDay);
        const now = new Date();

        then.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);

        const diff = Math.floor((now - then) / (1000 * 60 * 60 * 24));
        this._daysSinceCache[fullKey] = diff;
        return diff;
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

    // Cache per DarkenColor
    _darkenColorCache: {},
    // Darkens a hex color by a percentage (0-1) (Memoized)
    darkenColor(hex, percent = 0.3) {
        const cacheKey = `${hex}_${percent}`;
        if (this._darkenColorCache[cacheKey]) return this._darkenColorCache[cacheKey];

        const rgb = this.hexToRgb(hex);
        if (!rgb) return hex;

        const r = Math.max(0, Math.floor(rgb.r * (1 - percent)));
        const g = Math.max(0, Math.floor(rgb.g * (1 - percent)));
        const b = Math.max(0, Math.floor(rgb.b * (1 - percent)));

        const result = `rgb(${r}, ${g}, ${b})`;
        this._darkenColorCache[cacheKey] = result;
        return result;
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
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/`/g, "&#96;")
            .replace(/\\/g, "&#92;")
            .replace(/\n/g, " ");
    }
};

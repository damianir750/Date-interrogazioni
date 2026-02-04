import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                interrogazioni: resolve(__dirname, 'interrogazioni.html'),
                archivio: resolve(__dirname, 'archivio.html'),
                calendar: resolve(__dirname, 'calendar.html'),
            },
        },
    },
});

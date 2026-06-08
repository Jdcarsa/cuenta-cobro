import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: [
                'resources/views/**',        // todas las vistas Blade
                'resources/js/**',           // todos los JS
                'resources/css/**',          // todos los CSS
                'app/Services/**',           // si cambias TributarioService
                'routes/**',                 // rutas
            ],
        }),
        tailwindcss(),
    ],
    server: {
        watch: {
            usePolling: true,    // ← importante en Linux/Zorin OS
            interval: 500,
        },
    },
});
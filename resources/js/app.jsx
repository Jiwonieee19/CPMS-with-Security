import './bootstrap';
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import { createRoot } from 'react-dom/client'
import ToastProvider from './Components/ToastProvider'
import IdleWatcher from './IdleWatcher'

createInertiaApp({
    title: (title) => {
        const appName = 'CPMS'
        return title ? `${title} | ${appName}` : appName
    },
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx')
        ),
    setup({ el, App, props }) {
        // read idle timeout from meta tag (seconds)
        let idleTimeout = 1200;
        const meta = document.querySelector('meta[name="session-idle-timeout"]');
        if (meta && meta.content) {
            const v = parseInt(meta.content, 10);
            if (!isNaN(v) && v > 0) idleTimeout = v;
        }

        createRoot(el).render(
            <IdleWatcher timeout={idleTimeout}>
                <ToastProvider>
                    <App {...props} />
                </ToastProvider>
            </IdleWatcher>
        )
    },
})
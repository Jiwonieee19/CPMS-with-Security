import './bootstrap';
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import { createRoot } from 'react-dom/client'
import ToastProvider from './Components/ToastProvider'

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
        createRoot(el).render(
            <ToastProvider>
                <App {...props} />
            </ToastProvider>
        )
    },
})
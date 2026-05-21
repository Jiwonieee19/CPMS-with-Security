import { useEffect, useRef } from 'react';
import axios from 'axios';

export default function IdleWatcher({ timeout = 1200, children }) {
    const timer = useRef(null);
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

    useEffect(() => {
        const reset = () => {
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(onIdle, timeout * 1000);
        };

        const handlePageShow = (event) => {
            if (event.persisted) {
                window.location.reload();
            }
        };

        const onIdle = async () => {
            try {
                await axios.post('/logout');
            } catch (e) {
                // ignore errors
            }
            window.location = '/';
        };

        // start timer
        reset();

        for (const e of events) {
            window.addEventListener(e, reset, { passive: true });
        }

        window.addEventListener('pageshow', handlePageShow);

        return () => {
            if (timer.current) clearTimeout(timer.current);
            for (const e of events) {
                window.removeEventListener(e, reset);
            }
            window.removeEventListener('pageshow', handlePageShow);
        };
    }, [timeout]);

    return children || null;
}

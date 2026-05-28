import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { createPortal } from 'react-dom';

const LogoutModal = lazy(() => import('./Modals/LogoutModal'));
const WARNING_SECONDS = 5;

export default function IdleWatcher({ timeout = 1200, children }) {
    const timer = useRef(null);
    const warningTimer = useRef(null);
    const countdownTimer = useRef(null);
    const logoutInProgress = useRef(false);
    const resetIdleTimerRef = useRef(() => { });
    const performLogoutRef = useRef(() => { });
    const [showLogoutWarning, setShowLogoutWarning] = useState(false);
    const [countdownSeconds, setCountdownSeconds] = useState(WARNING_SECONDS);
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    const isLoginPage = window.location.pathname === '/';

    useEffect(() => {
        if (isLoginPage) {
            return () => { };
        }

        const clearTimers = () => {
            if (timer.current) clearTimeout(timer.current);
            if (warningTimer.current) clearTimeout(warningTimer.current);
            if (countdownTimer.current) clearInterval(countdownTimer.current);

            timer.current = null;
            warningTimer.current = null;
            countdownTimer.current = null;
        };

        const hideWarning = () => {
            setShowLogoutWarning(false);
            setCountdownSeconds(WARNING_SECONDS);
        };

        const performLogout = async () => {
            if (logoutInProgress.current) return;

            logoutInProgress.current = true;
            clearTimers();
            hideWarning();

            try {
                await axios.post('/logout');
            } catch (e) {
                // ignore errors
            }

            window.location = '/';
        };

        const startWarning = () => {
            if (logoutInProgress.current) return;

            clearTimers();
            setShowLogoutWarning(true);
            setCountdownSeconds(WARNING_SECONDS);

            countdownTimer.current = setInterval(() => {
                setCountdownSeconds((current) => {
                    if (current <= 1) {
                        performLogout();
                        return WARNING_SECONDS;
                    }

                    return current - 1;
                });
            }, 1000);
        };

        const scheduleWarning = () => {
            if (logoutInProgress.current) return;

            if (timeout <= WARNING_SECONDS) {
                startWarning();
                return;
            }

            warningTimer.current = setTimeout(startWarning, (timeout - WARNING_SECONDS) * 1000);
        };

        const reset = () => {
            if (logoutInProgress.current) return;

            clearTimers();
            hideWarning();
            scheduleWarning();
        };

        const handlePageShow = (event) => {
            if (event.persisted) {
                window.location.reload();
            }
        };

        resetIdleTimerRef.current = reset;
        performLogoutRef.current = performLogout;

        // start timer
        reset();

        for (const e of events) {
            window.addEventListener(e, reset, { passive: true });
        }

        window.addEventListener('pageshow', handlePageShow);

        return () => {
            clearTimers();
            logoutInProgress.current = false;
            for (const e of events) {
                window.removeEventListener(e, reset);
            }
            window.removeEventListener('pageshow', handlePageShow);
        };
    }, [timeout, isLoginPage]);

    const handleWarningCancel = () => {
        resetIdleTimerRef.current();
    };

    const handleWarningConfirm = () => {
        performLogoutRef.current();
    };

    return (
        <>
            {children || null}
            {!isLoginPage && createPortal(
                <Suspense fallback={null}>
                    <LogoutModal
                        isOpen={showLogoutWarning}
                        onClose={handleWarningCancel}
                        onConfirm={handleWarningConfirm}
                        title="Session Expiring"
                        message={`You will be logged out in ${countdownSeconds} seconds due to inactivity.`}
                        confirmLabel="LOG OUT NOW"
                        cancelLabel="CANCEL"
                    />
                </Suspense>,
                document.body
            )}
        </>
    );
}

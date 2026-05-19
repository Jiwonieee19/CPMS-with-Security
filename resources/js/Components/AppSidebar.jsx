import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePage } from '@inertiajs/react';
import companyLogo from '../assets/company-logo.png';
import HelpSign from '../assets/icons/icon-help.png';
import Door from '../assets/icons/icon-logout.png';

const LogoutModal = lazy(() => import('../Modals/LogoutModal'));
const WeatherGeneralNotificationModal = lazy(() => import('../Modals/WeatherGeneralNotificationModal'));

const LayoutDashboard = new URL('../assets/icons/icon-dashboard.png', import.meta.url).href;
const LayoutDashboardFocus = new URL('../assets/icons/icon-dashboard-focus.png', import.meta.url).href;
const CloudSnow = new URL('../assets/icons/icon-weather.png', import.meta.url).href;
const CloudSnowFocus = new URL('../assets/icons/icon-weather-focus.png', import.meta.url).href;
const Clock = new URL('../assets/icons/icon-process.png', import.meta.url).href;
const ClockFocus = new URL('../assets/icons/icon-process-focus.png', import.meta.url).href;
const Notebook = new URL('../assets/icons/icon-logs.png', import.meta.url).href;
const NotebookFocus = new URL('../assets/icons/icon-logs-focus.png', import.meta.url).href;
const Package = new URL('../assets/icons/icon-inventory.png', import.meta.url).href;
const PackageFocus = new URL('../assets/icons/icon-inventory-focus.png', import.meta.url).href;
const User = new URL('../assets/icons/icon-account.png', import.meta.url).href;
const UserFocus = new URL('../assets/icons/icon-account-focus.png', import.meta.url).href;

const normalizeRole = (role) => {
    if (!role) return '';
    return role
        .toString()
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const roleNavAccess = {
    'account manager': ['Accounts'],
    'inventory manager': ['Inventory'],
    'process manager': ['Process'],
    'weather analyst': ['Weather'],
    'quality manager': ['Process'],
    'quality analyst': ['Process'],
};

const mainNavItems = [

    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        iconFocus: LayoutDashboardFocus,
    },

    {
        title: 'Weather',
        href: '/weather',
        icon: CloudSnow,
        iconFocus: CloudSnowFocus,
    },

    {
        title: 'Process',
        href: '/process',
        icon: Clock,
        iconFocus: ClockFocus,
    },

    {
        title: 'Logs',
        href: '/logs',
        icon: Notebook,
        iconFocus: NotebookFocus,
    },

    {
        title: 'Inventory',
        href: '/inventory',
        icon: Package,
        iconFocus: PackageFocus,
    },

    {
        title: 'Accounts',
        href: '/accounts',
        icon: User,
        iconFocus: UserFocus,
    },

];

export default function Sidebar() {
    const hrefHere = window.location.pathname;
    const { auth } = usePage().props || {};
    const role = normalizeRole(auth?.user?.staff_role ?? auth?.user?.role);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [hasLoadedLogoutModal, setHasLoadedLogoutModal] = useState(false);
    const [weatherNotification, setWeatherNotification] = useState(null);
    const [isWeatherNotificationOpen, setIsWeatherNotificationOpen] = useState(false);
    const [hasLoadedWeatherNotificationModal, setHasLoadedWeatherNotificationModal] = useState(false);

    const allowedTitles = roleNavAccess[role] || [];
    const isAdmin = role === 'admin';

    const isItemAccessible = (item) => {
        if (item.title === 'Dashboard' || item.title === 'Logs') return true;
        if (!role) return true;
        if (isAdmin) return true;
        return allowedTitles.includes(item.title);
    };

    const weatherNotificationStorageKey = useMemo(() => {
        const userId = auth?.user?.staff_id ?? auth?.user?.id ?? 'unknown';
        return `weatherNotificationSeen:${userId}`;
    }, [auth?.user?.staff_id, auth?.user?.id]);

    useEffect(() => {
        if (showLogoutModal) setHasLoadedLogoutModal(true);
    }, [showLogoutModal]);

    useEffect(() => {
        if (isWeatherNotificationOpen) setHasLoadedWeatherNotificationModal(true);
    }, [isWeatherNotificationOpen]);

    useEffect(() => {
        if (!role || role === 'weather analyst') return;

        let isActive = true;

        const parseDateValue = (value) => {
            if (!value) return null;
            const parsed = new Date(value);
            return Number.isNaN(parsed.getTime()) ? null : parsed;
        };

        const buildAlertItem = (alert) => ({
            type: 'alert',
            id: alert.alert_id ?? alert.id,
            createdAt: alert.created_at ?? alert.alert_date,
            message: alert.alert_message,
            action: alert.alert_action,
            severity: alert.alert_severity,
        });

        const buildReportItem = (report) => ({
            type: 'notify',
            id: report.report_id ?? report.id,
            createdAt: report.created_at ?? report.report_date,
            message: report.report_message,
            action: report.report_action,
        });

        const fetchLatestWeatherNotification = async () => {
            try {
                const [alertsResponse, reportsResponse] = await Promise.all([
                    fetch('/weather-alerts/active'),
                    fetch('/weather-reports'),
                ]);

                if (!alertsResponse.ok || !reportsResponse.ok) return;

                const alertsPayload = await alertsResponse.json();
                const reportsPayload = await reportsResponse.json();

                const alerts = (alertsPayload.alerts || []).map(buildAlertItem);
                const reports = (reportsPayload.reports || []).map(buildReportItem);

                const candidates = [...alerts, ...reports].filter((item) => item.id);
                if (candidates.length === 0) return;

                candidates.sort((a, b) => {
                    const dateA = parseDateValue(a.createdAt) || new Date(0);
                    const dateB = parseDateValue(b.createdAt) || new Date(0);
                    return dateB - dateA;
                });

                const latest = candidates[0];
                const latestKey = `${latest.type}:${latest.id}`;
                const lastSeen = localStorage.getItem(weatherNotificationStorageKey);

                if (!isActive || lastSeen === latestKey) return;

                setWeatherNotification(latest);
                setIsWeatherNotificationOpen(true);
            } catch (error) {
                console.error('Error fetching weather notifications:', error);
            }
        };

        fetchLatestWeatherNotification();

        return () => {
            isActive = false;
        };
    }, [role, weatherNotificationStorageKey]);

    const handleCloseWeatherNotification = () => {
        if (weatherNotification?.id) {
            const latestKey = `${weatherNotification.type}:${weatherNotification.id}`;
            localStorage.setItem(weatherNotificationStorageKey, latestKey);
        }
        setIsWeatherNotificationOpen(false);
    };

    const handleLogoutClick = (e) => {
        e.preventDefault();
        setShowLogoutModal(true);
    };

    return (
        <div className="fixed left-0 top-0 h-screen w-94 bg-[#311F1C] text-3xl text-[#F5F5DC] font-medium p-4 overflow-y-auto">
            <div className='bg-[#3E2723] p-5 my-7 rounded-xl'>
                <img src={companyLogo} alt="Company Logo" className="" />
            </div>
            <nav className="space-y-2">
                {mainNavItems.map((item) => {
                    const isAccessible = isItemAccessible(item);
                    return (
                        <a
                            key={item.href}
                            href={isAccessible ? item.href : '#'}
                            onClick={(e) => !isAccessible && e.preventDefault()}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl pt-4 pb-5 transition-colors duration-200 ${!isAccessible
                                ? 'opacity-40 cursor-not-allowed pointer-events-none'
                                : item.href === hrefHere
                                    ? 'bg-[#E5B917] text-[#311F1C]'
                                    : 'hover:bg-[#3E2723]'
                                }`}
                        >
                            <img src={item.href === hrefHere && isAccessible ? item.iconFocus : item.icon} alt={item.title} className="w-8 h-8 mt-1" />
                            <span>{item.title}</span>
                        </a>
                    );
                })}
            </nav>
            <div className='bg-[#3E2723] p-4 my-1 mt-30 rounded-lg flex items-center justify-start gap-4'>
                <button onClick={handleLogoutClick} title="Logout" className="hover:opacity-80 transition-opacity">
                    <img src={Door} alt="Logout Logo" className="w-8 h-8" />
                </button>
                <a href="#" title="Help" className="hover:opacity-80 transition-opacity">
                    <img src={HelpSign} alt="Help Logo" className="w-8 h-8" />
                </a>
            </div>

            {(hasLoadedLogoutModal || showLogoutModal) &&
                createPortal(
                    <Suspense fallback={null}>
                        <LogoutModal
                            isOpen={showLogoutModal}
                            onClose={() => setShowLogoutModal(false)}
                        />
                    </Suspense>,
                    document.body
                )}

            {(hasLoadedWeatherNotificationModal || isWeatherNotificationOpen) &&
                createPortal(
                    <Suspense fallback={null}>
                        <WeatherGeneralNotificationModal
                            isOpen={isWeatherNotificationOpen}
                            onClose={handleCloseWeatherNotification}
                            notification={weatherNotification}
                        />
                    </Suspense>,
                    document.body
                )}
        </div>
    );
}
import { Suspense, lazy, useState } from 'react'
import { Menu, Cloud } from 'lucide-react'
import { router } from '@inertiajs/react'
import AppSidebar from '../Components/AppSidebar'
import '../Styles/scrollbar.css'

const WeatherDecisionModal = lazy(() => import('../Modals/WeatherDecisionModal'))

export default function WeatherPage({ weather }) {

    const [activeTab, setActiveTab] = useState('temperature')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [hasLoadedDecisionModal, setHasLoadedDecisionModal] = useState(false)

    // ================= REAL WEATHER DATA =================
    const hours = weather?.forecast?.forecastday?.[0]?.hour || [];

    const graphData = hours.map(h => ({
        hour: new Date(h.time).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }),
        temperature: Math.round(h.temp_c),
        humidity: h.humidity,
        windSpeed: Math.round(h.wind_kph),
    }));
    // =====================================================

    const getDataForTab = () => {
        return graphData.map(item => ({
            hour: item.hour,
            value:
                activeTab === 'temperature'
                    ? item.temperature
                    : activeTab === 'humidity'
                        ? item.humidity
                        : item.windSpeed
        }));
    };

    const displayData = getDataForTab();

    const formatValue = (value) => {
        if (activeTab === 'temperature') return `${value}°C`;
        if (activeTab === 'humidity') return `${value}%`;
        return `${value} km/h`;
    };

    const getFooterLabel = () => {
        if (activeTab === 'temperature') return 'Temperature Degrees Celsius (°C)';
        if (activeTab === 'humidity') return 'Humidity Percentage (%)';
        return 'Wind Speed (km/h)';
    };

    const isAboveNormal = (value) => {
        if (activeTab === 'temperature') return value > 35; // Above 35°C
        if (activeTab === 'humidity') return value > 85; // Above 85%
        return value > 25; // Wind above 25 km/h
    };

    const getBarColor = (value) => {
        return isAboveNormal(value) ? '#FF6769' : '#F5F5DC';
    };

    const today = new Date();
    const dateString = `${today.toLocaleString('default', { month: 'short' })} ${today.getDate()} ${today.getFullYear()}`;

    const maxValue =
        activeTab === 'temperature'
            ? 50
            : activeTab === 'humidity'
                ? 100
                : 50;

    const barWidth = 150;
    const visibleBars = 8;
    const graphHeight = 430;

    const Megaphone = new URL('../assets/icons/icon-megaphone.png', import.meta.url).href;

    const handleOpenModal = () => {
        setHasLoadedDecisionModal(true)
        setIsModalOpen(true);
    };

    const handleNavigateToLogs = () => {
        router.visit('/logs?tab=weather');
    };

    return (
        <div className="min-h-screen bg-[#F5F5DC]">
            <AppSidebar />

            <div className="ml-96 pt-14 px-10 bg-[#F5F5DC]">
                <h1 className="text-6xl font-extrabold text-[#E5B917] mb-10">
                    WEATHER MONITORING
                </h1>

                {/* ================== TABS + SEARCH ================== */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-6">
                        {/* Tabs */}
                        <div className="flex bg-[#3E2723] p-2 rounded-2xl gap-2">
                            <button
                                onClick={() => setActiveTab('temperature')}
                                className={`px-10 py-2 rounded-lg font-semibold transition
                                    ${activeTab === 'temperature'
                                        ? 'bg-[#E5B917] text-[#3E2723]'
                                        : 'text-[#F5F5DC] hover:bg-[#65524F]'
                                    }`}
                            >
                                TEMPERATURE
                            </button>

                            <button
                                onClick={() => setActiveTab('humidity')}
                                className={`px-10 py-2 rounded-lg font-semibold transition
                                    ${activeTab === 'humidity'
                                        ? 'bg-[#E5B917] text-[#3E2723]'
                                        : 'text-[#F5F5DC] hover:bg-[#65524F]'
                                    }`}
                            >
                                HUMIDITY
                            </button>

                            <button
                                onClick={() => setActiveTab('wind')}
                                className={`px-10 py-2 rounded-lg font-semibold transition
                                    ${activeTab === 'wind'
                                        ? 'bg-[#E5B917] text-[#3E2723]'
                                        : 'text-[#F5F5DC] hover:bg-[#65524F]'
                                    }`}
                            >
                                WIND
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleOpenModal}
                            className="relative bg-[#E5B917] p-4 rounded-lg hover:bg-[#3E2723] transition flex items-center justify-center"
                        >
                            <img src={Megaphone} alt="Megaphone" className="w-8 h-8" />
                        </button>
                        <button
                            onClick={handleNavigateToLogs}
                            className="bg-[#E5B917] p-4 rounded-lg hover:bg-[#3E2723] transition"
                        >
                            <Menu size={32} className="text-[#F5F5DC]" strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* ================== GRAPH ================== */}
                <div className="bg-[#3E2723] text-[#F5F5DC] p-6 rounded-lg">
                    <h2 className="text-3xl font-semibold mb-2 flex items-center gap-2">
                        <Cloud size={40} />
                        HOURLY FORECAST GRAPH
                    </h2>

                    <p className="text-center text-xl text-[#E5B917] mb-4">
                        {dateString}
                    </p>

                    <div
                        className="border-2 border-[#65524F] rounded overflow-x-auto relative pt-10 pb-0 w-full"
                    >
                        {/* Background stripes */}
                        <div
                            className="absolute top-0 left-0 flex flex-col justify-between pointer-events-none"
                            style={{ height: graphHeight, width: `${displayData.length * barWidth}px` }}
                        >
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-full border-1 border-[#65524F] opacity-50"
                                />
                            ))}
                        </div>

                        <div
                            className="flex items-end h-full gap-2 px-2 relative z-10"
                            style={{ width: `${displayData.length * barWidth}px`, height: graphHeight }}
                        >
                            {displayData.map((data, index) => (
                                <div key={index} className="flex flex-col items-center justify-end h-full" style={{ width: barWidth }}>
                                    <span className="text-sm font-bold text-[#F5F5DC] mb-1">
                                        {formatValue(data.value)}
                                    </span>
                                    <div
                                        className="w-2/3 rounded-t-3xl flex items-start justify-center pt-2"
                                        style={{
                                            height: `${(data.value / maxValue) * 100}%`,
                                            backgroundColor: getBarColor(data.value)
                                        }}
                                    >
                                    </div>
                                    <span className="text-xs mt-2">{data.hour}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 text-lg">
                        {getFooterLabel()}
                    </div>
                </div>
            </div>

            {(hasLoadedDecisionModal || isModalOpen) && (
                <Suspense fallback={null}>
                    <WeatherDecisionModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                    />
                </Suspense>
            )}
        </div>
    )
}

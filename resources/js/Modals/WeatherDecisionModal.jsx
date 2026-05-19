import { Suspense, lazy, useEffect, useState } from 'react';
import { X } from 'lucide-react';

const WeatherNotifyModal = lazy(() => import('./WeatherNotifyModal'));
const WeatherAlertModal = lazy(() => import('./WeatherAlertModal'));

export default function WeatherDecisionModal({ isOpen, onClose }) {
    const [isRendering, setIsRendering] = useState(isOpen);
    const [isVisible, setIsVisible] = useState(false);
    const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [hasLoadedNotifyModal, setHasLoadedNotifyModal] = useState(false);
    const [hasLoadedAlertModal, setHasLoadedAlertModal] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsRendering(true);
            requestAnimationFrame(() => setIsVisible(true));
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => setIsRendering(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isNotifyModalOpen) setHasLoadedNotifyModal(true);
    }, [isNotifyModalOpen]);

    useEffect(() => {
        if (isAlertModalOpen) setHasLoadedAlertModal(true);
    }, [isAlertModalOpen]);

    const handleNotifyClick = () => {
        setIsNotifyModalOpen(true);
    };

    const handleAlertClick = () => {
        setIsAlertModalOpen(true);
    };

    const handleNotifyClose = () => {
        setIsNotifyModalOpen(false);
        onClose();
    };

    const handleAlertClose = () => {
        setIsAlertModalOpen(false);
        onClose();
    };

    if (!isRendering) return null;

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/85 flex items-center justify-center z-50 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            >
                <div
                    className={`bg-[#3E2723] rounded-3xl p-8 w-full max-w-md relative transform transition-all duration-500 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold text-[#E5B917]">WEATHER ANALYSIS</h2>
                        <button
                            onClick={onClose}
                            className="text-[#E5B917] hover:text-[#d4a815] transition"
                        >
                            <X size={32} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Buttons */}
                    <div className="grid grid-cols-2 gap-6 mt-8 text-center">
                        <label className="block text-[#F5F5DC] text-lg font-semibold">
                            GOOD WEATHER
                        </label>
                        <label className="block text-[#F5F5DC] text-lg font-semibold">
                            BAD WEATHER
                        </label>
                        <button
                            onClick={handleNotifyClick}
                            className="py-3 rounded-2xl bg-[#311F1C] text-[#E5B917] text-xl font-semibold hover:bg-[#E5B917] hover:text-[#311F1C] transition"
                        >
                            NOTIFY
                        </button>
                        <button
                            onClick={handleAlertClick}
                            className="py-3 rounded-2xl bg-[#311F1C] text-[#FF6769] text-xl font-semibold hover:bg-[#FF6769] hover:text-[#311F1C] transition"
                        >
                            ALERT
                        </button>
                    </div>
                </div>
            </div>

            {(hasLoadedNotifyModal || isNotifyModalOpen) && (
                <Suspense fallback={null}>
                    <WeatherNotifyModal
                        isOpen={isNotifyModalOpen}
                        onClose={handleNotifyClose}
                    />
                </Suspense>
            )}
            {(hasLoadedAlertModal || isAlertModalOpen) && (
                <Suspense fallback={null}>
                    <WeatherAlertModal
                        isOpen={isAlertModalOpen}
                        onClose={handleAlertClose}
                    />
                </Suspense>
            )}
        </>
    );
}
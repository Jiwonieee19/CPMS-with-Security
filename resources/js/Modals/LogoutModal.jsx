import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function LogoutModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'LOGOUT',
    message = 'Are you sure you want to log out?',
    confirmLabel = 'LOGOUT',
    cancelLabel = 'CANCEL',
}) {
    const [isRendering, setIsRendering] = useState(isOpen);
    const [isVisible, setIsVisible] = useState(false);

    // Handle mount/unmount with fade/scale transitions
    useEffect(() => {
        if (isOpen) {
            setIsRendering(true);
            // allow next paint to apply visible classes
            requestAnimationFrame(() => setIsVisible(true));
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => setIsRendering(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        } else {
            window.location.href = '/logout';
        }
    };

    const handleCancel = () => {
        onClose();
    };

    if (!isRendering) return null;

    return (
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
                    <h2 className="text-3xl font-bold text-[#E5B917]">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-[#E5B917] hover:text-[#d4a815] transition"
                    >
                        <X size={32} strokeWidth={3} />
                    </button>
                </div>

                {/* Content */}
                <div className="mb-8 text-center">
                    <p className="text-[#F5F5DC] text-lg mb-2">
                        {message}
                    </p>
                    {/* <p className="text-[#F5F5DC] text-sm mt-4">
                        You will need to log in again to access the system.
                    </p> */}
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-6 mt-8">
                    <button
                        onClick={handleCancel}
                        className="py-3 rounded-2xl bg-[#311F1C] text-[#F5F5DC] text-xl font-semibold hover:bg-[#E5B917] hover:text-[#311F1C] transition"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="py-3 rounded-2xl bg-[#311F1C] text-[#E5B917] text-xl font-semibold hover:bg-[#E5B917] hover:text-[#311F1C] transition"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
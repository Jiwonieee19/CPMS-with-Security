import { Suspense, lazy, useState, useEffect, useCallback } from 'react'
import { Clock, CheckCircle, Menu, Star } from 'lucide-react'
import AppSidebar from '../Components/AppSidebar'
import { useToast } from '../Components/ToastProvider'
import { router, usePage } from '@inertiajs/react'

const ProceedProcessModal = lazy(() => import('../Modals/ProceedProcessModal'))
const GradingProcessModal = lazy(() => import('../Modals/GradingProcessModal'))


export default function ProcessPage() {

    const { auth } = usePage().props || {};
    const role = (auth?.user?.staff_role ?? auth?.user?.role ?? '')
        .toString()
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const canViewDriedTab = role === 'quality manager' || role === 'quality analyst' || role === 'admin';
    const isQualityAnalystOnly = role === 'quality analyst';
    const canViewProcessTab = !isQualityAnalystOnly;

    const [activeTab, setActiveTab] = useState(isQualityAnalystOnly ? 'dried' : 'process')
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [isProceedProcessModalOpen, setIsProceedProcessModalOpen] = useState(false)
    const [selectedProcess, setSelectedProcess] = useState(null)
    const [isGradingProcessModalOpen, setIsGradingProcessModalOpen] = useState(false)
    const [selectedGradingItem, setSelectedGradingItem] = useState(null)
    const [processData, setProcessData] = useState([])
    const [driedData, setDriedData] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [sortColumn, setSortColumn] = useState(null)
    const [sortDirection, setSortDirection] = useState('asc')
    const toast = useToast()

    const [hasLoadedProceedProcessModal, setHasLoadedProceedProcessModal] = useState(false)
    const [hasLoadedGradingProcessModal, setHasLoadedGradingProcessModal] = useState(false)

    useEffect(() => {
        if (isProceedProcessModalOpen) setHasLoadedProceedProcessModal(true)
    }, [isProceedProcessModalOpen])

    useEffect(() => {
        if (isGradingProcessModalOpen) setHasLoadedGradingProcessModal(true)
    }, [isGradingProcessModalOpen])

    // Reset to page 1 when search term or tab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activeTab]);

    useEffect(() => {
        if (!canViewDriedTab && activeTab === 'dried') {
            setActiveTab('process');
        }
        if (isQualityAnalystOnly && activeTab === 'process') {
            setActiveTab('dried');
        }
    }, [activeTab, canViewDriedTab, isQualityAnalystOnly]);

    const fetchProcesses = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/processes/list');

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const data = await response.json();
            setProcessData(data.processes || []);
        } catch (err) {
            console.error('Error fetching processes:', err);
            const errorMsg = `Failed to load processes: ${err.message}`;
            setError(errorMsg);
            toast.error(errorMsg);
            setProcessData([]);
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const fetchDriedBatches = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/batches/dried');

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const data = await response.json();
            setDriedData(data.batches || []);
        } catch (err) {
            console.error('Error fetching dried batches:', err);
            const errorMsg = `Failed to load dried batches: ${err.message}`;
            setError(errorMsg);
            toast.error(errorMsg);
            setDriedData([]);
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (activeTab === 'process') {
            fetchProcesses();
        } else if (activeTab === 'dried') {
            fetchDriedBatches();
        }
    }, [activeTab, fetchProcesses, fetchDriedBatches]);

    const Search = new URL('../assets/icons/icon-search.png', import.meta.url).href

    const activeData = activeTab === 'process' ? processData : driedData

    // ================== SEARCH FILTER ==================
    const filteredData = activeData.filter(item =>
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.dayCount.toString().includes(searchTerm.toLowerCase()) ||
        item.racks.toString().includes(searchTerm.toLowerCase()) ||
        item.status.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Sort data
    const sortedData = [...filteredData].sort((a, b) => {
        if (!sortColumn) return 0;

        let aValue = a[sortColumn];
        let bValue = b[sortColumn];

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    // ================== PAGINATION LOGIC ==================
    const itemsPerPage = 5;
    const totalItems = sortedData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const rangeStart = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const rangeEnd = totalItems > 0 ? Math.min(currentPage * itemsPerPage, totalItems) : 0;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedData = sortedData.slice(startIndex, endIndex);

    // Calculate visible page numbers (max 3 page buttons)
    const maxVisiblePages = 3;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

    const handleProceedProcess = (process) => {
        setSelectedProcess(process);
        setIsProceedProcessModalOpen(true);
    };

    const handleGradingProcess = (item) => {
        setSelectedGradingItem(item);
        setIsGradingProcessModalOpen(true);
    };

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const getSortIcon = (column) => {
        if (sortColumn !== column) return '⇅';
        return sortDirection === 'asc' ? '↑' : '↓';
    };

    return (
        <div className="min-h-screen bg-[#F5F5DC]">
            <AppSidebar />

            <div className="ml-96 px-14 pt-14 pb-10 bg-[#F5F5DC]">
                <h1 className="text-6xl font-extrabold text-[#E5B917] mb-10">
                    PROCESS MANAGEMENT
                </h1>

                {/* ================== TABS + SEARCH ================== */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-6">
                        {/* Tabs */}
                        <div className="flex bg-[#3E2723] p-2 rounded-2xl gap-2">
                            {canViewProcessTab && (
                                <button
                                    onClick={() => setActiveTab('process')}
                                    className={`px-10 py-2 rounded-lg font-semibold transition
                                        ${activeTab === 'process'
                                            ? 'bg-[#E5B917] text-[#3E2723]'
                                            : 'text-[#F5F5DC] hover:bg-[#65524F]'
                                        }`}
                                >
                                    PROCESS
                                </button>
                            )}
                            {canViewDriedTab && (
                                <button
                                    onClick={() => setActiveTab('dried')}
                                    className={`px-10 py-2 rounded-lg font-semibold transition
                                        ${activeTab === 'dried'
                                            ? 'bg-[#E5B917] text-[#3E2723]'
                                            : 'text-[#F5F5DC] hover:bg-[#65524F]'
                                        }`}
                                >
                                    DRIED
                                </button>
                            )}
                        </div>

                        {/* Search */}
                        <div className="relative w-96">
                            <input
                                type="text"
                                placeholder="SEARCH HERE ...."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-6 py-3 pl-14 border-4 border-[#3E2723]
                                           rounded-3xl bg-[#F5F5DC] text-[#3E2723]
                                           focus:outline-none"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                <img src={Search} alt="Search" className="w-8 h-8" />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => router.visit('/logs?tab=process')}
                            className="bg-[#E5B917] p-4 rounded-lg hover:bg-[#3E2723] transition"
                            title="View Process Logs"
                        >
                            <Menu size={32} className="text-[#F5F5DC]" strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* ================== TABLE ================== */}
                <div className="bg-[#3E2723] rounded-lg p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Clock size={38} className="text-[#F5F5DC]" />
                        <h2 className="text-3xl font-semibold text-[#F5F5DC]">
                            {activeTab === 'process' ? 'PROCESS BATCHLIST' : 'DRIED BATCHLIST'}
                        </h2>
                    </div>

                    <div className="border-t-2 border-[#65524F] mb-6"></div>

                    {/* Header */}
                    <div className="grid grid-cols-5 text-[#E5B917] font-semibold text-lg mb-4 text-center">
                        <div
                            className='flex items-center justify-center gap-2 cursor-pointer hover:text-[#d4a815] transition'
                            onClick={() => handleSort('id')}
                        >
                            BATCH ID
                            <span className="text-xl">{getSortIcon('id')}</span>
                        </div>
                        <div
                            className='flex items-center justify-center gap-2 cursor-pointer hover:text-[#d4a815] transition'
                            onClick={() => handleSort('dayCount')}
                        >
                            DAY COUNT
                            <span className="text-xl">{getSortIcon('dayCount')}</span>
                        </div>
                        <div
                            className='flex items-center justify-center gap-2 cursor-pointer hover:text-[#d4a815] transition'
                            onClick={() => handleSort('racks')}
                        >
                            RACK/S
                            <span className="text-xl">{getSortIcon('racks')}</span>
                        </div>
                        <div
                            className='flex items-center justify-center gap-2 cursor-pointer hover:text-[#d4a815] transition'
                            onClick={() => handleSort('status')}
                        >
                            TYPE
                            <span className="text-xl">{getSortIcon('status')}</span>
                        </div>
                        <div className='ml-4'>ACTION</div>

                    </div>

                    {/* Rows */}
                    <div className="space-y-3">
                        {paginatedData.length > 0 ? (
                            paginatedData.map(item => (
                                <div
                                    key={item.id}
                                    className="grid grid-cols-5 text-center items-center
                                               py-4 px-6 rounded-lg border-2 gap-18
                                               border-[#65524F] text-[#F5F5DC]"
                                >
                                    <div>{item.id}</div>
                                    <div>{item.dayCount}</div>
                                    <div>{item.racks}</div>
                                    <div className={activeTab === 'dried' && item.status === 'Low' ? 'text-rose-400' : ''}>
                                        {item.status}
                                    </div>
                                    <div className="flex justify-center">
                                        {activeTab === 'dried' ? (
                                            <Star
                                                size={28}
                                                className="cursor-pointer hover:scale-110 transition"
                                                onClick={() => handleGradingProcess(item)}
                                            />
                                        ) : (
                                            <CheckCircle
                                                size={28}
                                                className="cursor-pointer hover:scale-110 transition"
                                                onClick={() => handleProceedProcess(item)}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-[#F5F5DC] text-xl">
                                No Data Found
                            </div>
                        )}
                    </div>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center text-[#3E2723] mt-6">
                    <div className="text-lg">
                        Showing <span className="font-bold">{rangeStart} - {rangeEnd}</span> of <span className="font-bold">{totalItems}</span>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border-2 border-[#3E2723] bg-[#F5F5DC] rounded hover:bg-[#3E2723] hover:text-[#F5F5DC] transition disabled:opacity-50"
                        >
                            ←
                        </button>

                        {visiblePages.map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-4 py-2 border-2 border-[#3E2723] rounded transition ${currentPage === page
                                    ? 'bg-[#3E2723] text-[#F5F5DC]'
                                    : 'bg-[#F5F5DC] hover:bg-[#3E2723] hover:text-[#F5F5DC]'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border-2 border-[#3E2723] bg-[#F5F5DC] rounded hover:bg-[#3E2723] hover:text-[#F5F5DC] transition disabled:opacity-50"
                        >
                            →
                        </button>
                    </div>
                </div>
            </div>

            {(hasLoadedProceedProcessModal || isProceedProcessModalOpen) && (
                <Suspense fallback={null}>
                    <ProceedProcessModal
                        isOpen={isProceedProcessModalOpen}
                        onClose={() => setIsProceedProcessModalOpen(false)}
                        process={selectedProcess}
                        onComplete={fetchProcesses}
                    />
                </Suspense>
            )}

            {(hasLoadedGradingProcessModal || isGradingProcessModalOpen) && (
                <Suspense fallback={null}>
                    <GradingProcessModal
                        isOpen={isGradingProcessModalOpen}
                        onClose={() => setIsGradingProcessModalOpen(false)}
                        batch={selectedGradingItem}
                        onComplete={fetchDriedBatches}
                    />
                </Suspense>
            )}
        </div>
    )
}

import { Suspense, lazy, useState, useEffect, useCallback } from 'react'
import { Package, Plus, ArrowLeft, Box, PlusCircle, CheckCircle, Truck, Cloud, Clock, FileText, Eye, User, Download } from 'lucide-react'
import { usePage } from '@inertiajs/react'
import AppSidebar from '../Components/AppSidebar'
import LogsExportProvider, { useLogsExport } from '../Components/LogsExport'

const ViewLogsModal = lazy(() => import('../Modals/ViewLogsModal'))


function LogsPageContent({ initialTab = 'weather' }) {

    const { url } = usePage()
    const queryParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    const tabFromQuery = queryParams.get('tab')

    const [activeTab, setActiveTab] = useState(tabFromQuery || initialTab)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [isViewLogsModalOpen, setIsViewLogsModalOpen] = useState(false)
    const [hasLoadedViewLogsModal, setHasLoadedViewLogsModal] = useState(false)
    const [selectedLogId, setSelectedLogId] = useState(null)
    const [logsData, setLogsData] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [sortColumn, setSortColumn] = useState(null)
    const [sortDirection, setSortDirection] = useState('asc')
    const User = new URL('../assets/icons/icon-person.png', import.meta.url).href;

    useEffect(() => {
        if (isViewLogsModalOpen) setHasLoadedViewLogsModal(true)
    }, [isViewLogsModalOpen])

    // Reset to page 1 when search term or tab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activeTab]);

    const Search = new URL('../assets/icons/icon-search.png', import.meta.url).href
    const { downloadLog } = useLogsExport()

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`/logs/list?type=${activeTab}`)

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`)
            }

            const data = await response.json()
            setLogsData(data.logs || [])
        } catch (err) {
            console.error('Error fetching logs:', err)
            setError(err.message || 'Failed to load logs')
            setLogsData([])
        } finally {
            setLoading(false)
        }
    }, [activeTab])

    useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    // ================== SEARCH FILTER ==================
    const filteredData = logsData.filter(item =>
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.date.toLowerCase().includes(searchTerm.toLowerCase())
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
    const itemsPerPage = 4;
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

    const handleViewLog = (id) => {
        setSelectedLogId(id);
        setIsViewLogsModalOpen(true);
    };

    const handleDownloadLog = (logItem) => {
        downloadLog(logItem, activeTab)
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

    const getTabIcon = () => {
        switch (activeTab) {
            case 'weather': return <Cloud size={38} className="text-[#F5F5DC] mt-1" />
            case 'process': return <Clock size={38} className="text-[#F5F5DC] mt-1" />
            case 'inventory': return <Package size={38} className="text-[#F5F5DC] mt-1" />
            case 'account': return <img src={User} alt="User Icon" className="w-9 h-9 mt-1" />
            // case 'account': return <User size={38} className="text-[#F5F5DC] mt-1" />
            default: return <Cloud size={38} className="text-[#F5F5DC] mt-1" />
        }
    }

    const getTabTitle = () => {
        switch (activeTab) {
            case 'weather': return 'WEATHER LOG REPORTS'
            case 'process': return 'PROCESS LOG REPORTS'
            case 'inventory': return 'INVENTORY LOG REPORTS'
            case 'account': return 'ACCOUNT LOG REPORTS'
            default: return 'LOG REPORTS'
        }
    }

    return (
        <div className="min-h-screen bg-[#F5F5DC]">
            <AppSidebar />

            <div className="ml-96 px-14 pt-14 pb-10 bg-[#F5F5DC]">
                <h1 className="text-6xl font-extrabold text-[#E5B917] mb-10">
                    LOGS MANAGEMENT
                </h1>

                {/* ================== TABS + SEARCH ================== */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-6">
                        {/* Tabs */}
                        <div className="flex bg-[#3E2723] p-2 rounded-2xl gap-2">
                            <button
                                onClick={() => setActiveTab('weather')}
                                className={`px-10 py-2 rounded-lg font-semibold transition
                                    ${activeTab === 'weather'
                                        ? 'bg-[#E5B917] text-[#3E2723]'
                                        : 'text-[#F5F5DC] hover:bg-[#65524F]'
                                    }`}
                            >
                                WEATHER
                            </button>

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

                            <button
                                onClick={() => setActiveTab('inventory')}
                                className={`px-10 py-2 rounded-lg font-semibold transition
                                    ${activeTab === 'inventory'
                                        ? 'bg-[#E5B917] text-[#3E2723]'
                                        : 'text-[#F5F5DC] hover:bg-[#65524F]'
                                    }`}
                            >
                                INVENTORY
                            </button>

                            <button
                                onClick={() => setActiveTab('account')}
                                className={`px-10 py-2 rounded-lg font-semibold transition
                                    ${activeTab === 'account'
                                        ? 'bg-[#E5B917] text-[#3E2723]'
                                        : 'text-[#F5F5DC] hover:bg-[#65524F]'
                                    }`}
                            >
                                ACCOUNT
                            </button>
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
                            onClick={() => window.history.back()}
                            className="bg-[#E5B917] p-4 rounded-lg hover:bg-[#3E2723] transition"
                        >
                            <ArrowLeft size={32} className="text-[#F5F5DC]" strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* ================== TABLE ================== */}
                <div className="bg-[#3E2723] rounded-lg p-8">
                    <div className="flex items-center gap-3 mb-6">
                        {getTabIcon()}
                        <h2 className="text-3xl font-semibold text-[#F5F5DC]">
                            {getTabTitle()}
                        </h2>
                    </div>

                    <div className="border-t-2 border-[#65524F] mb-6"></div>

                    {/* Header: responsive gaps with minimum threshold */}
                    <div className="grid grid-cols-5 gap-x-[clamp(0.75rem,1.5vw,4rem)] text-[#E5B917] font-semibold text-lg mb-4 text-center">
                        <div
                            className='flex items-center justify-center gap-2 cursor-pointer hover:text-[#d4a815] transition min-w-0'
                            onClick={() => handleSort('id')}
                        >
                            LOG ID
                            <span className="text-xl">{getSortIcon('id')}</span>
                        </div>
                        <div
                            className='flex items-center justify-center gap-2 cursor-pointer hover:text-[#d4a815] transition min-w-0'
                            onClick={() => handleSort('task')}
                        >
                            TASK
                            <span className="text-xl">{getSortIcon('task')}</span>
                        </div>
                        <div
                            className='flex items-center justify-center gap-2 cursor-pointer hover:text-[#d4a815] transition min-w-0'
                            onClick={() => handleSort('timeSaved')}
                        >
                            TIME SAVED
                            <span className="text-xl">{getSortIcon('timeSaved')}</span>
                        </div>
                        <div
                            className='flex items-center justify-center gap-2 cursor-pointer hover:text-[#d4a815] transition min-w-0'
                            onClick={() => handleSort('date')}
                        >
                            DATE
                            <span className="text-xl">{getSortIcon('date')}</span>
                        </div>
                        <div className='ml-4 min-w-0'>ACTION</div>
                    </div>

                    {/* Rows */}
                    <div className="space-y-3">
                        {loading ? (
                            <div className="text-center py-10 text-[#F5F5DC] text-xl">
                                Loading logs...
                            </div>
                        ) : error ? (
                            <div className="text-center py-10 text-red-200 text-xl">
                                {error}
                            </div>
                        ) : paginatedData.length > 0 ? (
                            paginatedData.map(item => (
                                <div
                                    key={item.id}
                                    className="grid grid-cols-5 gap-x-[clamp(0.5rem,1.2vw,3.5rem)] text-center items-center py-3 sm:py-4 px-4 sm:px-6 rounded-lg border-2 border-[#65524F] text-[#F5F5DC]"
                                >
                                    <div className="min-w-0">{item.id}</div>
                                    <div className="min-w-0 truncate">
                                        {(activeTab === 'inventory' || activeTab === 'process') && item.batch_id
                                            ? `${item.task}: ${item.batch_id}`
                                            : item.task
                                        }
                                    </div>
                                    <div className="min-w-0">{item.timeSaved}</div>
                                    <div className="min-w-0">{item.date}</div>
                                    <div className="flex justify-center gap-3">
                                        <Eye
                                            size={28}
                                            className="cursor-pointer hover:scale-110 transition text-[#F5F5DC] relative top-[3px] flex-shrink-0"
                                            onClick={() => handleViewLog(item.log_id ?? item.id)}
                                        />
                                        <Download
                                            size={28}
                                            className="cursor-pointer hover:scale-110 transition text-[#F5F5DC] flex-shrink-0"
                                            onClick={() => handleDownloadLog(item)}
                                        />
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

            {(hasLoadedViewLogsModal || isViewLogsModalOpen) && (
                <Suspense fallback={null}>
                    <ViewLogsModal
                        isOpen={isViewLogsModalOpen}
                        onClose={() => setIsViewLogsModalOpen(false)}
                        logId={selectedLogId}
                    />
                </Suspense>
            )}
        </div>
    )
}

export default function LogsPage({ initialTab = 'weather' }) {
    return (
        <LogsExportProvider>
            <LogsPageContent initialTab={initialTab} />
        </LogsExportProvider>
    )
}

import { Suspense, lazy, useState, useEffect, useCallback } from 'react'
import { Package, Plus, Menu, Box, PlusCircle, CheckCircle, Truck } from 'lucide-react'
import { router } from '@inertiajs/react'
import AppSidebar from '../Components/AppSidebar'
import { useToast } from '../Components/ToastProvider'

const AddNewEquipmentModal = lazy(() => import('../Modals/AddNewEquipmentModal'))
const AddFreshBeanModal = lazy(() => import('../Modals/AddFreshBeansModal'))
const AddStockEquipmentModal = lazy(() => import('../Modals/AddStockEquipmentModal'))
const ProceedBeansBatchModal = lazy(() => import('../Modals/ProceedBeansBatchModal'))
const ProceedBeansPickupModal = lazy(() => import('../Modals/ProceedBeansPickupModal'))


export default function InventoryPage() {

    const [activeTab, setActiveTab] = useState('beans')
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [isAddEquipmentModalOpen, setIsAddEquipmentModalOpen] = useState(false)
    const [isAddBeanModalOpen, setIsAddBeanModalOpen] = useState(false)
    const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false)
    const [selectedEquipment, setSelectedEquipment] = useState(null)
    const [isProceedBeansModalOpen, setIsProceedBeansModalOpen] = useState(false)
    const [selectedBean, setSelectedBean] = useState(null)
    const [isProceedPickupModalOpen, setIsProceedPickupModalOpen] = useState(false)
    const [selectedPickupBeanId, setSelectedPickupBeanId] = useState(null)
    const [equipmentStockData, setEquipmentStockData] = useState([])
    const [beanStockData, setBeanStockData] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [sortColumn, setSortColumn] = useState(null)
    const [sortDirection, setSortDirection] = useState('asc')
    const toast = useToast()

    const [hasLoadedAddEquipmentModal, setHasLoadedAddEquipmentModal] = useState(false)
    const [hasLoadedAddBeanModal, setHasLoadedAddBeanModal] = useState(false)
    const [hasLoadedAddStockModal, setHasLoadedAddStockModal] = useState(false)
    const [hasLoadedProceedBeansModal, setHasLoadedProceedBeansModal] = useState(false)
    const [hasLoadedProceedPickupModal, setHasLoadedProceedPickupModal] = useState(false)

    useEffect(() => {
        if (isAddEquipmentModalOpen) setHasLoadedAddEquipmentModal(true)
    }, [isAddEquipmentModalOpen])

    useEffect(() => {
        if (isAddBeanModalOpen) setHasLoadedAddBeanModal(true)
    }, [isAddBeanModalOpen])

    useEffect(() => {
        if (isAddStockModalOpen) setHasLoadedAddStockModal(true)
    }, [isAddStockModalOpen])

    useEffect(() => {
        if (isProceedBeansModalOpen) setHasLoadedProceedBeansModal(true)
    }, [isProceedBeansModalOpen])

    useEffect(() => {
        if (isProceedPickupModalOpen) setHasLoadedProceedPickupModal(true)
    }, [isProceedPickupModalOpen])

    // Reset to page 1 when search term or tab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activeTab]);

    const fetchBatches = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/batches/list');

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const data = await response.json();
            setBeanStockData(data.batches || []);
        } catch (err) {
            console.error('Error fetching batches:', err);
            const errorMsg = `Failed to load batches: ${err.message}`;
            setError(errorMsg);
            toast.error(errorMsg);
            setBeanStockData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchEquipments = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/equipments/list');

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const data = await response.json();
            setEquipmentStockData(data.equipments || []);
        } catch (err) {
            console.error('Error fetching equipments:', err);
            const errorMsg = `Failed to load equipments: ${err.message}`;
            setError(errorMsg);
            toast.error(errorMsg);
            setEquipmentStockData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'beans') {
            fetchBatches();
        } else if (activeTab === 'equipments') {
            fetchEquipments();
        }
    }, [activeTab, fetchEquipments, fetchBatches]);

    const Search = new URL('../assets/icons/icon-search.png', import.meta.url).href

    const activeData = activeTab === 'beans' ? beanStockData : equipmentStockData

    // ================== SEARCH FILTER ==================
    const filteredData = activeData.filter(item =>
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

    const handleAddItem = () => {
        if (activeTab === 'equipments') {
            setIsAddEquipmentModalOpen(true);
        } else {
            setIsAddBeanModalOpen(true);
        }
    };

    const handleAddStock = (equipment) => {
        setSelectedEquipment(equipment);
        setIsAddStockModalOpen(true);
    };

    const handleProceedBeans = (batch) => {
        setSelectedBean(batch);
        setIsProceedBeansModalOpen(true);
    };

    const handleProceedPickup = (id) => {
        setSelectedPickupBeanId(id);
        setIsProceedPickupModalOpen(true);
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
                    INVENTORY MANAGEMENT
                </h1>

                {/* ================== TABS + SEARCH ================== */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-6">
                        {/* Tabs */}
                        <div className="flex bg-[#3E2723] p-2 rounded-2xl gap-2">
                            <button
                                onClick={() => setActiveTab('equipments')}
                                className={`px-10 py-2 rounded-lg font-semibold transition
                                    ${activeTab === 'equipments'
                                        ? 'bg-[#E5B917] text-[#3E2723]'
                                        : 'text-[#F5F5DC] hover:bg-[#65524F]'
                                    }`}
                            >
                                EQUIPMENTS
                            </button>

                            <button
                                onClick={() => setActiveTab('beans')}
                                className={`px-10 py-2 rounded-lg font-semibold transition
                                    ${activeTab === 'beans'
                                        ? 'bg-[#E5B917] text-[#3E2723]'
                                        : 'text-[#F5F5DC] hover:bg-[#65524F]'
                                    }`}
                            >
                                BEANS
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
                            onClick={handleAddItem}
                            className="relative bg-[#E5B917] p-4 rounded-lg hover:bg-[#3E2723] transition flex items-center justify-center"
                        >
                            <Box size={32} className="text-[#F5F5DC]" strokeWidth={3} />
                            <span className="absolute inline-flex items-center justify-center ml-7 mt-3 w-4 h-4 rounded-full bg-[#F5F5DC] text-[#E5B917] hover:text-[#3E2723] transition">
                                <Plus size={18} strokeWidth={3} />
                            </span>
                        </button>
                        <button
                            onClick={() => router.visit('/logs?tab=inventory')}
                            className="bg-[#E5B917] p-4 rounded-lg hover:bg-[#3E2723] transition"
                        >
                            <Menu size={32} className="text-[#F5F5DC]" strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* ================== TABLE ================== */}
                <div className="bg-[#3E2723] rounded-lg p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Package size={38} className="text-[#F5F5DC]" />
                        <h2 className="text-3xl font-semibold text-[#F5F5DC]">
                            {activeTab === 'beans' ? 'BEAN STOCKLIST' : 'EQUIPMENT STOCKLIST'}
                        </h2>
                    </div>

                    <div className="border-t-2 border-[#65524F] mb-6"></div>

                    {/* Header */}
                    <div className="grid grid-cols-5 text-[#E5B917] font-semibold text-lg mb-4 text-center">
                        <div
                            className='flex items-center justify-center gap-2 cursor-pointer hover:text-[#d4a815] transition'
                            onClick={() => handleSort('id')}
                        >
                            {activeTab === 'beans' ? 'BATCH ID' : 'EQUIPMENT ID'}
                            <span className="text-xl">{getSortIcon('id')}</span>
                        </div>
                        <div
                            className='flex items-center justify-center gap-2 cursor-pointer hover:text-[#d4a815] transition'
                            onClick={() => handleSort('item')}
                        >
                            {activeTab === 'beans' ? 'ITEM USED' : 'NAME'}
                            <span className="text-xl">{getSortIcon('item')}</span>
                        </div>
                        <div
                            className='flex items-center justify-center gap-2 cursor-pointer hover:text-[#d4a815] transition'
                            onClick={() => handleSort('quantity')}
                        >
                            QUANTITY
                            <span className="text-xl">{getSortIcon('quantity')}</span>
                        </div>
                        <div
                            className='flex items-center justify-center gap-2 cursor-pointer hover:text-[#d4a815] transition'
                            onClick={() => handleSort('status')}
                        >
                            STATUS
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
                                    <div>{item.item}</div>
                                    <div>{item.quantity}</div>
                                    <div className={
                                        activeTab === 'equipments' ?
                                            item.status === 'Low' ? 'text-[#FF6769] font-semibold' :
                                                item.status === 'High' ? 'text-green-400 font-semibold' :
                                                    'text-[#F5F5DC] font-semibold'
                                            : ''
                                    }>
                                        {item.status}
                                    </div>
                                    <div className="flex justify-center">
                                        {activeTab === 'equipments' ? (
                                            <PlusCircle
                                                size={28}
                                                className="cursor-pointer hover:scale-110 transition"
                                                onClick={() => handleAddStock(item)}
                                            />
                                        ) : (
                                            item.status === 'Graded' ? (
                                                <Truck
                                                    size={28}
                                                    className="cursor-pointer hover:scale-110 transition"
                                                    onClick={() => handleProceedPickup(item.id)}
                                                />
                                            ) : (
                                                <CheckCircle
                                                    size={28}
                                                    className="cursor-pointer hover:scale-110 transition"
                                                    onClick={() => handleProceedBeans(item)}
                                                />
                                            )
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

            {(hasLoadedAddEquipmentModal || isAddEquipmentModalOpen) && (
                <Suspense fallback={null}>
                    <AddNewEquipmentModal
                        isOpen={isAddEquipmentModalOpen}
                        onClose={() => setIsAddEquipmentModalOpen(false)}
                        onAdded={fetchEquipments}
                    />
                </Suspense>
            )}

            {(hasLoadedAddBeanModal || isAddBeanModalOpen) && (
                <Suspense fallback={null}>
                    <AddFreshBeanModal
                        isOpen={isAddBeanModalOpen}
                        onClose={() => setIsAddBeanModalOpen(false)}
                        onAdded={fetchBatches}
                    />
                </Suspense>
            )}

            {(hasLoadedAddStockModal || isAddStockModalOpen) && (
                <Suspense fallback={null}>
                    <AddStockEquipmentModal
                        isOpen={isAddStockModalOpen}
                        onClose={() => setIsAddStockModalOpen(false)}
                        equipment={selectedEquipment}
                        onStockAdded={fetchEquipments}
                    />
                </Suspense>
            )}

            {(hasLoadedProceedBeansModal || isProceedBeansModalOpen) && (
                <Suspense fallback={null}>
                    <ProceedBeansBatchModal
                        isOpen={isProceedBeansModalOpen}
                        onClose={() => setIsProceedBeansModalOpen(false)}
                        batch={selectedBean}
                        onProceed={fetchBatches}
                    />
                </Suspense>
            )}

            {(hasLoadedProceedPickupModal || isProceedPickupModalOpen) && (
                <Suspense fallback={null}>
                    <ProceedBeansPickupModal
                        isOpen={isProceedPickupModalOpen}
                        onClose={() => setIsProceedPickupModalOpen(false)}
                        batchId={selectedPickupBeanId}
                        onPickedUp={fetchBatches}
                    />
                </Suspense>
            )}
        </div>
    )
}

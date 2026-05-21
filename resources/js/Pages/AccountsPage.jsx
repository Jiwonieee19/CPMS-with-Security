import { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { Edit, Eye, Trash2, Plus, Menu, RotateCcw } from 'lucide-react';
import { router, usePage } from '@inertiajs/react';
import AppSidebar from '../Components/AppSidebar';
import { useToast } from '../Components/ToastProvider';

const EditAccountModal = lazy(() => import('../Modals/EditAccountModal'));
const ViewAccountModal = lazy(() => import('../Modals/ViewAccountModal'));
const DeleteAccountModal = lazy(() => import('../Modals/DeleteAccountModal'));
const CreateAccountModal = lazy(() => import('../Modals/CreateAccountModal'));

export default function AccountsPage() {
    const { auth } = usePage().props;
    const currentUser = auth?.user;
    const isAccountManager = (currentUser?.staff_role || '').toLowerCase() === 'account manager';
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [hasLoadedEditModal, setHasLoadedEditModal] = useState(false);
    const [hasLoadedViewModal, setHasLoadedViewModal] = useState(false);
    const [hasLoadedDeleteModal, setHasLoadedDeleteModal] = useState(false);
    const [hasLoadedCreateModal, setHasLoadedCreateModal] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    const [accountsData, setAccountsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortColumn, setSortColumn] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');
    const toast = useToast();

    useEffect(() => {
        if (isEditModalOpen) setHasLoadedEditModal(true);
    }, [isEditModalOpen]);

    useEffect(() => {
        if (isViewModalOpen) setHasLoadedViewModal(true);
    }, [isViewModalOpen]);

    useEffect(() => {
        if (isDeleteModalOpen) setHasLoadedDeleteModal(true);
    }, [isDeleteModalOpen]);

    useEffect(() => {
        if (isCreateModalOpen) setHasLoadedCreateModal(true);
    }, [isCreateModalOpen]);

    const fetchStaffs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('Fetching from /staffs/list...');
            const response = await fetch('/staffs/list');

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Error response:', errorData);
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const data = await response.json();
            console.log('Staffs data received:', data);

            setAccountsData(data.staffs || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching staffs:', err);
            const errorMsg = `Failed to load staffs data: ${err.message}`;
            setError(errorMsg);
            toast.error(errorMsg);
            setAccountsData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch staffs data from API
    useEffect(() => {
        fetchStaffs();
    }, [fetchStaffs]);

    // Reset to page 1 when search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Filter accounts based on search term
    const filteredAccounts = accountsData.filter(account => {
        const search = searchTerm.toLowerCase();
        return (
            account.id.toLowerCase().includes(search) ||
            account.fullname.toLowerCase().includes(search) ||
            account.role.toLowerCase().includes(search) ||
            account.status.toLowerCase().includes(search)
        );
    });

    // Sort accounts
    const sortedAccounts = [...filteredAccounts].sort((a, b) => {
        if (!sortColumn) return 0;

        let aValue = a[sortColumn];
        let bValue = b[sortColumn];

        // Convert to lowercase for case-insensitive sorting
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const itemsPerPage = 5;
    const totalAccounts = sortedAccounts.length;
    const totalPages = Math.ceil(totalAccounts / itemsPerPage);
    const rangeStart = totalAccounts > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const rangeEnd = totalAccounts > 0 ? Math.min(currentPage * itemsPerPage, totalAccounts) : 0;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalAccounts);
    const paginatedAccounts = sortedAccounts.slice(startIndex, endIndex);
    const User = new URL('../assets/icons/icon-person.png', import.meta.url).href;
    const Search = new URL('../assets/icons/icon-search.png', import.meta.url).href;

    // Calculate visible page numbers (max 3 page buttons)
    const maxVisiblePages = 3;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

    const handleEdit = (id, status) => {
        if (isAccountManager && Number(id) === Number(currentUser?.staff_id)) {
            toast.error('You cannot edit your own account.');
            return;
        }

        if (status && status.toLowerCase() === 'inactive') {
            toast.error('Account is inactive, cannot be edited.');
            return;
        }
        setSelectedAccountId(id);
        setIsEditModalOpen(true);
    };

    const handleView = (id) => {
        setSelectedAccountId(id);
        setIsViewModalOpen(true);
    };

    const handleDelete = (id) => {
        if (isAccountManager && Number(id) === Number(currentUser?.staff_id)) {
            toast.error('You cannot deactivate your own account.');
            return;
        }
        setSelectedAccountId(id);
        setIsDeleteModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedAccountId();
        setIsCreateModalOpen(true);
    };

    const handleViewLogs = () => {
        router.visit('/logs?tab=account');
    };

    const handleSort = (column) => {
        if (sortColumn === column) {
            // Toggle direction if same column
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // New column, default to ascending
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
            <div className="ml-96 px-14 pt-14 pb-10 bg-[#F5F5DC] min-h-screen">
                <h1 className="text-6xl font-extrabold text-[#E5B917] mb-8">ACCOUNT MANAGEMENT</h1>
                <div className="space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-100 border-2 border-red-500 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    {/* Search and Actions Bar */}
                    <div className="flex justify-between items-center">
                        <div className="relative w-96">
                            <input
                                type="text"
                                placeholder="SEARCH HERE ...."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-7 py-3 pl-14 border-4 border-[#3E2723] rounded-3xl bg-[#F5F5DC] text-[#3E2723] placeholder-[#3E2723] focus:outline-none focus:ring-2 focus:ring-[#E5B917]"
                            />
                            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                <img src={Search} alt="Search" className="w-10 h-10" />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => handleCreate()}
                                className="bg-[#E5B917] p-4 rounded-lg hover:bg-[#3E2723] transition"
                            >
                                <Plus size={32} className="text-[#F5F5DC]" strokeWidth={3} />
                            </button>
                            <button
                                onClick={handleViewLogs}
                                className="bg-[#E5B917] p-4 rounded-lg hover:bg-[#3E2723] transition"
                            >
                                <Menu size={32} className="text-[#F5F5DC]" strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-[#3E2723] rounded-lg p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 pt-2 flex items-center justify-center">
                                <img src={User} alt="Staff Icon" />
                            </div>
                            <h2 className="text-3xl font-semibold text-[#F5F5DC]">ACCOUNTLIST</h2>
                        </div>

                        <div className="border-t-2 border-[#65524F] mb-6"></div>

                        {/* Table Header: gaps shrink with viewport but not below a minimum */}
                        <div className="grid grid-cols-5 gap-x-[clamp(0.75rem,1.5vw,4rem)] mb-4 text-[#E5B917] font-semibold text-lg text-center">
                            <div
                                className="flex items-center justify-center gap-2 cursor-pointer hover:text-[#d4a815] transition min-w-0"
                                onClick={() => handleSort('id')}
                            >
                                ACOUNT ID
                                <span className="text-xl">{getSortIcon('id')}</span>
                            </div>
                            <div
                                className="flex items-center justify-center gap-2 cursor-pointer hover:text-[#d4a815] transition min-w-0"
                                onClick={() => handleSort('fullname')}
                            >
                                FULLNAME
                                <span className="text-xl">{getSortIcon('fullname')}</span>
                            </div>
                            <div
                                className="flex items-center justify-center gap-2 cursor-pointer hover:text-[#d4a815] transition min-w-0"
                                onClick={() => handleSort('role')}
                            >
                                ROLE
                                <span className="text-xl">{getSortIcon('role')}</span>
                            </div>
                            <div
                                className="flex items-center justify-center gap-2 cursor-pointer hover:text-[#d4a815] transition min-w-0"
                                onClick={() => handleSort('status')}
                            >
                                STATUS
                                <span className="text-xl">{getSortIcon('status')}</span>
                            </div>
                            <div className="text-center min-w-0">ACTION</div>
                        </div>

                        {/* Loading State */}
                        {loading && (
                            <div className="py-8 text-center text-[#F5F5DC] text-xl font-semibold">
                                Loading accounts...
                            </div>
                        )}

                        {/* Table Rows */}
                        {!loading && (
                            <div className="space-y-3">
                                {paginatedAccounts.length > 0 ? (
                                    paginatedAccounts.map((account) => (
                                        (() => {
                                            const isOwnAccount = isAccountManager && Number(account.staff_id) === Number(currentUser?.staff_id);
                                            return (
                                                <div
                                                    key={account.id}
                                                    className="grid grid-cols-5 gap-x-[clamp(0.5rem,1.2vw,3.5rem)] bg-[#3E2723] bg-opacity-50 py-3 sm:py-4 px-4 sm:px-6 rounded-lg text-[#F5F5DC] items-center text-center border-2 border-[#65524F]"
                                                >
                                                    <div className="min-w-0">{account.id}</div>
                                                    <div className="min-w-0 truncate">{account.fullname}</div>
                                                    <div className="min-w-0">{account.role}</div>
                                                    <div className={account.status.toLowerCase() === 'inactive' ? 'text-[#FF6769] min-w-0' : 'min-w-0'}>
                                                        {account.status}
                                                    </div>
                                                    <div className="flex justify-center gap-3">
                                                        <button
                                                            onClick={() => handleEdit(account.staff_id, account.status)}
                                                            disabled={isOwnAccount}
                                                            className={`hover:scale-110 transition flex-shrink-0 ${account.status.toLowerCase() === 'inactive' || isOwnAccount ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        >
                                                            <Edit size={28} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleView(account.staff_id)}
                                                            className="hover:scale-110 transition flex-shrink-0"
                                                        >
                                                            <Eye size={28} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(account.staff_id)}
                                                            disabled={isOwnAccount}
                                                            className={`hover:scale-110 transition flex-shrink-0 ${isOwnAccount ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        >
                                                            {account.status.toLowerCase() === 'inactive' ? (
                                                                <RotateCcw size={28} />
                                                            ) : (
                                                                <Trash2 size={28} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    ))
                                ) : (
                                    <div className="py-8 text-center text-[#F5F5DC] text-xl font-semibold">
                                        No Account Found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-between items-center text-[#3E2723] mt-6">
                        <div className="text-lg">
                            Showing <span className="font-bold">{rangeStart} - {rangeEnd}</span> Accounts from <span className="font-bold">{totalAccounts}</span>
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
            </div>

            {(hasLoadedEditModal || isEditModalOpen) && (
                <Suspense fallback={null}>
                    <EditAccountModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        staffId={selectedAccountId}
                        accountsData={accountsData}
                        onUpdated={fetchStaffs}
                    />
                </Suspense>
            )}

            {(hasLoadedViewModal || isViewModalOpen) && (
                <Suspense fallback={null}>
                    <ViewAccountModal
                        isOpen={isViewModalOpen}
                        onClose={() => setIsViewModalOpen(false)}
                        staffId={selectedAccountId}
                        accountsData={accountsData}
                    />
                </Suspense>
            )}

            {(hasLoadedDeleteModal || isDeleteModalOpen) && (
                <Suspense fallback={null}>
                    <DeleteAccountModal
                        isOpen={isDeleteModalOpen}
                        onClose={() => setIsDeleteModalOpen(false)}
                        staffId={selectedAccountId}
                        accountsData={accountsData}
                        onStatusUpdated={fetchStaffs}
                    />
                </Suspense>
            )}

            {(hasLoadedCreateModal || isCreateModalOpen) && (
                <Suspense fallback={null}>
                    <CreateAccountModal
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        accountsData={accountsData}
                        onCreated={fetchStaffs}
                    />
                </Suspense>
            )}
        </div>
    );
}
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/admin.service';
import { NomineeUser, PaginatedResponse } from '../types';
import {
  Users,
  ExternalLink,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  XCircle,
  RotateCcw,
  Search,
  Eye,
  X,
  Trash2,
  User,
} from 'lucide-react';
import TruncatedText from '../components/TruncatedText';

type ReviewStatus = 'pending' | 'verified' | 'rejected' | 'draft' | 'all';

export default function NomineeReview() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<PaginatedResponse<NomineeUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 25;
  const [selectedNominee, setSelectedNominee] = useState<NomineeUser | null>(null);
  const [detailActionLoading, setDetailActionLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadNominees();
    }, searchQuery ? 500 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, searchQuery]);

  const loadNominees = async () => {
    try {
      setLoading(true);
      setError('');
      const search = searchQuery.trim() || undefined;
      const data = await adminService.getNomineeDocuments(page, limit, statusFilter, search);
      setRecords(data);
      setSelectedNominee((prev) => {
        if (!prev) {
          return prev;
        }
        return data.data.find((nominee) => nominee.id === prev.id) || null;
      });
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load nominee documents');
      setRecords({ data: [], pagination: { page: 1, limit, total: 0, totalPages: 1 } });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadNominees();
  };

  const handleVerify = async (documentId: string) => {
    try {
      await adminService.verifyNomineeDocument(documentId);
      loadNominees();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to verify document');
    }
  };

  const handleReject = async (documentId: string) => {
    if (!confirm('Are you sure you want to reject this document?')) return;
    try {
      await adminService.rejectNomineeDocument(documentId);
      loadNominees();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject document');
    }
  };

  const handleRemoveVerification = async (documentId: string) => {
    if (!confirm('Are you sure you want to remove verification from this document?')) return;
    try {
      await adminService.rejectNomineeDocument(documentId);
      loadNominees();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove verification');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) return;
    try {
      await adminService.deleteNomineeDocument(documentId);
      loadNominees();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete document');
    }
  };

  const handleAcceptNomineeWithoutDocuments = async (nomineeId: string) => {
    if (!confirm('Are you sure you want to accept this nominee without documents?')) return;
    try {
      await adminService.acceptNomineeWithoutDocuments(nomineeId);
      loadNominees();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to accept nominee');
    }
  };

  const handleVerifyNomineeDetails = async (nomineeId: string) => {
    if (!confirm('Are you sure you want to verify nominee details and accept the nominee?')) return;
    try {
      await adminService.verifyNomineeDetails(nomineeId);
      await loadNominees();
      setSelectedNominee(null);
      alert('Nominee details verified');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to verify nominee details');
    }
  };

  const handleRejectNomineeWithoutDocuments = async (nomineeId: string) => {
    if (!confirm('Are you sure you want to reject this nominee without documents?')) return;
    try {
      await adminService.rejectNomineeWithoutDocuments(nomineeId);
      loadNominees();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject nominee');
    }
  };

  const formatRelationship = (relationship: string) => {
    return relationship
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const openNomineeDetail = (nominee: NomineeUser) => {
    setSelectedNominee(nominee);
  };

  const closeNomineeDetail = () => {
    setSelectedNominee(null);
  };

  const handleDeleteNominee = async (nomineeId: string) => {
    if (!confirm('Are you sure you want to delete this nominee? This will permanently delete the nominee and all associated documents. This action cannot be undone.')) return;
    try {
      await adminService.deleteNominee(nomineeId);
      alert('Nominee deleted successfully');
      setSelectedNominee(null);
      loadNominees();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete nominee');
    }
  };

  const handleBulkVerifySelectedNominee = async () => {
    if (!selectedNominee) {
      return;
    }

    const documentsToVerify = selectedNominee.documents.filter(
      (doc) => !doc.isVerified && !doc.rejectedAt
    );

    if (documentsToVerify.length === 0) {
      alert('No pending documents to verify for this nominee.');
      return;
    }

    try {
      setDetailActionLoading(true);
      for (const doc of documentsToVerify) {
        await adminService.verifyNomineeDocument(doc.id);
      }
      await loadNominees();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to verify pending documents');
    } finally {
      setDetailActionLoading(false);
    }
  };

  const renderStatusBadge = (nominee: NomineeUser) => {
    const statusClass = nominee.status === 'ACCEPTED'
      ? 'status-active'
      : nominee.status === 'PENDING'
      ? 'status-pending'
      : nominee.status === 'REJECTED'
      ? 'status-rejected'
      : nominee.status === 'DRAFT'
      ? 'status-inactive'
      : 'status-inactive';
    const label = nominee.status === 'ACCEPTED' ? 'VERIFIED' : nominee.status;
    return <span className={statusClass}>{label}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-brand rounded-xl blur-lg opacity-60 animate-pulse-glow"></div>
            <div className="relative p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-glow-brand">
              <Users className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-brand">Nominee Review</h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Review and verify nominee documents</p>
          </div>
        </div>
        <button
          onClick={loadNominees}
          disabled={loading}
          className="btn-outline-brand flex items-center justify-center space-x-2 disabled:opacity-50 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto"
        >
          <RefreshCcw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
          <span className="sm:hidden">Refresh</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card p-4 sm:p-5 border border-cyan-400/20">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-cyan-500 dark:text-cyan-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search nominees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-cyan-400/30 dark:border-cyan-500/30 rounded-xl bg-white dark:bg-navy-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-400 dark:focus:ring-cyan-500 focus:border-cyan-400 dark:focus:border-cyan-500 transition-all duration-300 placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={handleSearch}
            className="btn-cyan text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3 w-full sm:w-auto"
          >
            Search
          </button>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <button
          onClick={() => { setStatusFilter('all'); setPage(1); }}
          className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-sm sm:text-base transition-all ${statusFilter === 'all'
            ? 'bg-gradient-brand text-white shadow-glow-brand'
            : 'bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-700 hover:border-brand-400 dark:hover:border-brand-500'
            }`}
        >
          ALL
        </button>
        <button
          onClick={() => { setStatusFilter('pending'); setPage(1); }}
          className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-sm sm:text-base transition-all ${statusFilter === 'pending'
            ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-glow-yellow'
            : 'bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-700 hover:border-yellow-400 dark:hover:border-yellow-500'
            }`}
        >
          PENDING
        </button>
        <button
          onClick={() => { setStatusFilter('verified'); setPage(1); }}
          className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-sm sm:text-base transition-all ${statusFilter === 'verified'
            ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-white shadow-glow-cyan'
            : 'bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-700 hover:border-cyan-400 dark:hover:border-cyan-500'
            }`}
        >
          VERIFIED
        </button>
        <button
          onClick={() => { setStatusFilter('rejected'); setPage(1); }}
          className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-sm sm:text-base transition-all ${statusFilter === 'rejected'
            ? 'bg-gradient-sunset text-white shadow-glow-orange'
            : 'bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-700 hover:border-orange-400 dark:hover:border-orange-500'
            }`}
        >
          REJECTED
        </button>
        <button
          onClick={() => { setStatusFilter('draft'); setPage(1); }}
          className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-sm sm:text-base transition-all ${statusFilter === 'draft'
            ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-glow-gray'
            : 'bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-700 hover:border-blue-400 dark:hover:border-blue-500'
            }`}
        >
          DRAFT
        </button>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 border-l-4 border-orange-500 text-orange-700 dark:text-orange-400 px-4 sm:px-5 py-3 sm:py-4 rounded-r-xl shadow-glow-orange text-sm sm:text-base">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-200 dark:border-brand-900 border-t-cyan-500 dark:border-t-cyan-400"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-brand opacity-20 blur-xl animate-pulse-glow"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse text-sm sm:text-base">Loading nominee documents...</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block card elevated overflow-hidden border border-brand-400/20">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 dark:divide-navy-700 table-fixed">
                <colgroup>
                  <col className="w-[25%]" />
                  <col className="w-[25%]" />
                  <col className="w-[12%]" />
                  <col className="w-[13%]" />
                  <col className="w-[25%]" />
                </colgroup>
                <thead className="bg-gradient-to-r from-navy-900 via-brand-900/50 to-navy-900 dark:from-navy-950 dark:via-brand-950/50 dark:to-navy-950">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Nominee Details</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Contact Info</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Uploaded</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-navy-900 divide-y divide-gray-200 dark:divide-navy-700">
                  {records?.data && records.data.length > 0 ? (
                    records.data.map((nominee) => (
                      <tr key={nominee.id} className="hover:bg-brand-50 dark:hover:bg-brand-950/10 transition-all duration-200 group">
                        <td className="px-4 py-4 overflow-hidden">
                          <div className="min-w-0 space-y-0.5">
                            <TruncatedText 
                              text={nominee.name} 
                              maxLength={20}
                              className="text-sm font-bold text-gray-900 dark:text-white block"
                            />
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">ID: {nominee.id}</div>
                            <TruncatedText 
                              text={`User: ${nominee.user.name}`} 
                              maxLength={25}
                              className="text-xs text-gray-500 dark:text-gray-400 block"
                            />
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">Relationship: {formatRelationship(nominee.relationship)}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 overflow-hidden">
                          <div className="min-w-0 space-y-0.5">
                            <TruncatedText 
                              text={nominee.email || '-'} 
                              maxLength={25}
                              className="text-sm text-gray-900 dark:text-white block"
                            />
                            <TruncatedText 
                              text={nominee.mobileNumber} 
                              maxLength={15}
                              className="text-xs text-gray-500 dark:text-gray-400 block"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {nominee.documents.length > 0 ? new Date(nominee.documents[0].uploadedAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4">{renderStatusBadge(nominee)}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {(() => {
                            const pendingDocs = nominee.documents.filter((doc) => !doc.isVerified && !doc.rejectedAt).length;
                            const verifiedDocs = nominee.documents.filter((doc) => doc.isVerified).length;
                            const rejectedDocs = nominee.documents.filter((doc) => doc.rejectedAt).length;
                            return (
                              <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-semibold">
                                  <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-300">
                                    <p>Pending</p>
                                    <p className="text-base font-bold">{pendingDocs}</p>
                                  </div>
                                  <div className="p-2 rounded-lg bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300">
                                    <p>Verified</p>
                                    <p className="text-base font-bold">{verifiedDocs}</p>
                                  </div>
                                  <div className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300">
                                    <p>Rejected</p>
                                    <p className="text-base font-bold">{rejectedDocs}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => openNomineeDetail(nominee)}
                                  className="w-full flex items-center justify-center px-4 py-2 text-sm font-semibold text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-500 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-all"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Review Details
                                </button>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center justify-center">
                          <Users className="w-12 h-12 text-gray-300 dark:text-navy-600 mb-3" />
                          <p>No nominee records found matching your criteria.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {records && records.pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-800/50">
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  Showing <span className="font-bold">{(page - 1) * limit + 1}</span> to <span className="font-bold">{Math.min(page * limit, records.pagination.total)}</span> of <span className="font-bold">{records.pagination.total}</span> records
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => setPage(page - 1)} disabled={page === 1} className="p-2 border border-gray-300 dark:border-navy-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-navy-700 text-gray-700 dark:text-gray-300 transition-colors" aria-label="Previous page">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setPage(page + 1)} disabled={page >= records.pagination.totalPages} className="p-2 border border-gray-300 dark:border-navy-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-navy-700 text-gray-700 dark:text-gray-300 transition-colors" aria-label="Next page">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden space-y-4">
            {records?.data && records.data.length > 0 ? (
              records.data.map((nominee) => {
                const pendingDocs = nominee.documents.filter((doc) => !doc.isVerified && !doc.rejectedAt).length;
                const verifiedDocs = nominee.documents.filter((doc) => doc.isVerified).length;
                const rejectedDocs = nominee.documents.filter((doc) => doc.rejectedAt).length;
                return (
                  <div
                    key={nominee.id}
                    className="card p-4 sm:p-5 border border-brand-400/20 hover:border-brand-400/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">{nominee.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-all">ID: {nominee.id}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">User: {nominee.user.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Relationship: {formatRelationship(nominee.relationship)}</div>
                      </div>
                      <div className="flex-shrink-0">
                        {renderStatusBadge(nominee)}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-start space-x-2">
                        <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {nominee.email || 'No email'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {nominee.mobileNumber}
                          </div>
                        </div>
                      </div>
                      {nominee.documents.length > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Uploaded: {new Date(nominee.documents[0].uploadedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs font-semibold">
                      <div className="p-2 sm:p-3 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-300">
                        <p className="text-[10px] sm:text-xs">Pending</p>
                        <p className="text-lg sm:text-xl font-bold">{pendingDocs}</p>
                      </div>
                      <div className="p-2 sm:p-3 rounded-lg bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300">
                        <p className="text-[10px] sm:text-xs">Verified</p>
                        <p className="text-lg sm:text-xl font-bold">{verifiedDocs}</p>
                      </div>
                      <div className="p-2 sm:p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300">
                        <p className="text-[10px] sm:text-xs">Rejected</p>
                        <p className="text-lg sm:text-xl font-bold">{rejectedDocs}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => openNomineeDetail(nominee)}
                      className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-500 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-all"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Review Details
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="card p-8 text-center border border-brand-400/20">
                <div className="flex flex-col items-center justify-center">
                  <Users className="w-12 h-12 text-gray-300 dark:text-navy-600 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No nominee records found matching your criteria.</p>
                </div>
              </div>
            )}

            {/* Pagination */}
            {records && records.pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 card p-3 sm:p-4 border border-brand-400/20">
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 text-center sm:text-left">
                  Showing <span className="font-bold">{(page - 1) * limit + 1}</span> to <span className="font-bold">{Math.min(page * limit, records.pagination.total)}</span> of <span className="font-bold">{records.pagination.total}</span> records
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-3 sm:px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-navy-700 text-gray-700 dark:text-gray-300 transition-colors" aria-label="Previous page">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setPage(page + 1)} disabled={page >= records.pagination.totalPages} className="px-3 sm:px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-navy-700 text-gray-700 dark:text-gray-300 transition-colors" aria-label="Next page">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      {selectedNominee && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm"
            onClick={closeNomineeDetail}
          ></div>
          <div className="relative z-50 w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl bg-white dark:bg-navy-900 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh] m-3 sm:m-4 md:m-6 mt-4 sm:mt-6 md:mt-8 mb-4 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 p-4 sm:p-6 border-b border-gray-100 dark:border-navy-700">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Nominee Review</p>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{selectedNominee.name}</h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 break-words">
                  Relationship: {formatRelationship(selectedNominee.relationship)} • Created {new Date(selectedNominee.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => navigate(`/users/${selectedNominee.user.id}`)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-500 rounded-lg sm:rounded-xl hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-all"
                  title="View all user details"
                >
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">View User Details</span>
                  <span className="sm:hidden">View User</span>
                </button>
                <button
                  onClick={closeNomineeDetail}
                  className="p-2 rounded-full bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-700 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-800/40">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Nominee Contact</p>
                  <p className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white mt-1 break-words">{selectedNominee.email || 'No email'}</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{selectedNominee.mobileNumber}</p>
                  {selectedNominee.address && (
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 break-words">{selectedNominee.address}</p>
                  )}
                </div>
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-800/40">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Linked User</p>
                  <p className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white mt-1 break-words">{selectedNominee.user.name}</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 break-words">{selectedNominee.user.email || 'No email'}</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{selectedNominee.user.mobileNumber}</p>
                </div>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Documents</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Complete the review before updating status</p>
                  </div>
                  {selectedNominee.documents.filter((doc) => !doc.isVerified && !doc.rejectedAt).length > 0 && (
                    <button
                      onClick={handleBulkVerifySelectedNominee}
                      disabled={detailActionLoading}
                      className="flex items-center justify-center px-3 sm:px-4 py-2 text-sm sm:text-base rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-lg disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {detailActionLoading ? 'Verifying…' : 'Verify All Pending'}
                    </button>
                  )}
                </div>

                {selectedNominee.documents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedNominee.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 shadow-sm"
                      >
                        <div className="flex flex-col gap-3 sm:gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white break-words">{doc.documentName}</p>
                            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{doc.documentType}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                            {doc.verifiedAt && (
                              <p className="text-xs text-green-600 dark:text-green-400">
                                Verified {new Date(doc.verifiedAt).toLocaleDateString()}
                              </p>
                            )}
                            {doc.rejectedAt && (
                              <p className="text-xs text-red-600 dark:text-red-400">
                                Rejected {new Date(doc.rejectedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={doc.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-500 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-all flex-1 sm:flex-none"
                            >
                              <ExternalLink className="w-3 h-3 mr-1.5" />
                              View
                            </a>
                            {!doc.isVerified ? (
                              <>
                                <button
                                  onClick={() => handleVerify(doc.id)}
                                  className="flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500 rounded-lg hover:bg-green-50 dark:hover:bg-green-500/10 transition-all flex-1 sm:flex-none"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1.5" />
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleReject(doc.id)}
                                  className="flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex-1 sm:flex-none"
                                >
                                  <XCircle className="w-3 h-3 mr-1.5" />
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500/10 transition-all flex-1 sm:flex-none"
                                  title="Delete document"
                                >
                                  <Trash2 className="w-3 h-3 mr-1.5" />
                                  Delete
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleRemoveVerification(doc.id)}
                                  className="flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all flex-1 sm:flex-none"
                                >
                                  <RotateCcw className="w-3 h-3 mr-1.5" />
                                  Revoke
                                </button>
                                <button
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500/10 transition-all flex-1 sm:flex-none"
                                  title="Delete document"
                                >
                                  <Trash2 className="w-3 h-3 mr-1.5" />
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-dashed border-gray-300 dark:border-navy-700 text-center space-y-3">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">No documents uploaded for this nominee.</p>
                    <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-3">
                        <button
                          onClick={() => handleAcceptNomineeWithoutDocuments(selectedNominee.id)}
                          className="flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500 rounded-xl hover:bg-green-50 dark:hover:bg-green-500/10 transition-all w-full sm:w-auto"
                        >
                          <CheckCircle className="w-4 h-4 mr-1.5" />
                          Accept Nominee
                        </button>
                        <button
                          onClick={() => handleVerifyNomineeDetails(selectedNominee.id)}
                          className="flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-semibold text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500 rounded-xl hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-all w-full sm:w-auto"
                        >
                          <Users className="w-4 h-4 mr-1.5" />
                          Verify Details
                        </button>
                        <button
                          onClick={() => handleRejectNomineeWithoutDocuments(selectedNominee.id)}
                          className="flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all w-full sm:w-auto"
                        >
                          <XCircle className="w-4 h-4 mr-1.5" />
                          Reject Nominee
                        </button>
                    </div>
                  </div>
                )}
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-navy-700">
                  <button
                    onClick={() => handleDeleteNominee(selectedNominee.id)}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-red-500/50 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Nominee
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


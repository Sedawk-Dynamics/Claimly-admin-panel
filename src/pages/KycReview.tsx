import { useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';
import { KycUser, PaginatedResponse } from '../types';
import {
  ShieldCheck,
  ExternalLink,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  XCircle,
  RotateCcw,
  Search,
  Eye,
  X,
  Trash2,
} from 'lucide-react';

type ReviewStatus = 'pending' | 'verified' | 'rejected';

export default function KycReview() {
  const [records, setRecords] = useState<PaginatedResponse<KycUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 25;
  const [selectedUser, setSelectedUser] = useState<KycUser | null>(null);
  const [detailActionLoading, setDetailActionLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDocuments();
    }, searchQuery ? 500 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, searchQuery]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      const search = searchQuery.trim() || undefined;
      const data = await adminService.getKycDocuments(page, limit, statusFilter || 'pending', search);
      setRecords(data);
      setSelectedUser((prev) => {
        if (!prev) {
          return prev;
        }
        return data.data.find((user) => user.id === prev.id) || null;
      });
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load KYC documents');
      setRecords({ data: [], pagination: { page: 1, limit, total: 0, totalPages: 1 } });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadDocuments();
  };

  const handleVerify = async (documentId: string) => {
    try {
      await adminService.verifyKycDocument(documentId);
      loadDocuments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to verify document');
    }
  };

  const handleReject = async (documentId: string) => {
    if (!confirm('Are you sure you want to reject this document?')) return;
    try {
      await adminService.rejectKycDocument(documentId);
      loadDocuments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject document');
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) return;
    try {
      await adminService.deleteKycDocument(documentId);
      loadDocuments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete document');
    }
  };

  const handleRemoveVerification = async (documentId: string) => {
    if (!confirm('Are you sure you want to remove verification from this document?')) return;
    try {
      await adminService.rejectKycDocument(documentId);
      loadDocuments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove verification');
    }
  };

  const handleAcceptUserWithoutDocuments = async (userId: string) => {
    if (!confirm('Are you sure you want to accept this user without documents?')) return;
    try {
      await adminService.acceptUserWithoutDocuments(userId);
      loadDocuments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to accept user');
    }
  };

  const handleRejectUserWithoutDocuments = async (userId: string) => {
    if (!confirm('Are you sure you want to reject this user without documents?')) return;
    try {
      await adminService.rejectUserWithoutDocuments(userId);
      loadDocuments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject user');
    }
  };

  const openUserDetail = (user: KycUser) => {
    setSelectedUser(user);
  };

  const closeUserDetail = () => {
    setSelectedUser(null);
  };

  const handleBulkVerifySelectedUser = async () => {
    if (!selectedUser) {
      return;
    }

    const documentsToVerify = selectedUser.documents.filter(
      (doc) => !doc.isVerified && !doc.rejectedAt
    );

    if (documentsToVerify.length === 0) {
      alert('No pending documents to verify for this user.');
      return;
    }

    try {
      setDetailActionLoading(true);
      for (const doc of documentsToVerify) {
        await adminService.verifyKycDocument(doc.id);
      }
      await loadDocuments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to verify pending documents');
    } finally {
      setDetailActionLoading(false);
    }
  };

  const renderStatusBadge = (user: KycUser) => {
    // Use the status field from API if available, otherwise fall back to calculation
    if (user.status) {
      switch (user.status) {
        case 'REJECTED':
          return <span className="badge badge-danger"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>;
        case 'ACCEPTED':
          return <span className="badge badge-success"><CheckCircle className="w-3 h-3 mr-1" /> Verified</span>;
        case 'DRAFT':
          return <span className="badge badge-info"><Clock className="w-3 h-3 mr-1" /> Draft</span>;
        case 'PENDING':
        default:
          return <span className="badge badge-warning"><Clock className="w-3 h-3 mr-1" /> Pending Verification</span>;
      }
    }

    // Fallback to manual calculation if status is not available
    const totalDocs = user.documents.length;
    const verifiedDocs = user.documents.filter((doc) => doc.isVerified).length;
    const rejectedDocs = user.documents.filter((doc) => doc.rejectedAt).length;

    // Show Rejected only if ALL documents are rejected
    if (rejectedDocs === totalDocs && totalDocs > 0) {
      return <span className="badge badge-danger"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>;
    }
    // Show Verified only if ALL documents are verified
    if (verifiedDocs === totalDocs && totalDocs > 0) {
      return <span className="badge badge-success"><CheckCircle className="w-3 h-3 mr-1" /> Verified</span>;
    }
    // Show Pending if ANY document is not verified (includes partially verified cases)
    return <span className="badge badge-warning"><Clock className="w-3 h-3 mr-1" /> Pending Verification</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-brand rounded-xl blur-lg opacity-60 animate-pulse-glow"></div>
            <div className="relative p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-glow-brand">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gradient-brand">KYC Review</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Review and verify Aadhaar and PAN documents</p>
          </div>
        </div>
        <button
          onClick={loadDocuments}
          disabled={loading}
          className="btn-outline-brand flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card p-5 border border-cyan-400/20">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cyan-500 dark:text-cyan-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-12 pr-4 py-3 border-2 border-cyan-400/30 dark:border-cyan-500/30 rounded-xl bg-white dark:bg-navy-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-400 dark:focus:ring-cyan-500 focus:border-cyan-400 dark:focus:border-cyan-500 transition-all duration-300 placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={handleSearch}
            className="btn-cyan"
          >
            Search
          </button>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => { setStatusFilter(undefined); setPage(1); }}
          className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${statusFilter === undefined
            ? 'bg-gradient-brand text-white shadow-glow-brand'
            : 'bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-700 hover:border-brand-400 dark:hover:border-brand-500'
            }`}
        >
          All
        </button>
        <button
          onClick={() => { setStatusFilter('pending'); setPage(1); }}
          className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${statusFilter === 'pending'
            ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-glow-yellow'
            : 'bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-700 hover:border-yellow-400 dark:hover:border-yellow-500'
            }`}
        >
          Pending
        </button>
        <button
          onClick={() => { setStatusFilter('verified'); setPage(1); }}
          className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${statusFilter === 'verified'
            ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-white shadow-glow-cyan'
            : 'bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-700 hover:border-cyan-400 dark:hover:border-cyan-500'
            }`}
        >
          Verified
        </button>
        <button
          onClick={() => { setStatusFilter('rejected'); setPage(1); }}
          className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${statusFilter === 'rejected'
            ? 'bg-gradient-sunset text-white shadow-glow-orange'
            : 'bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-700 hover:border-orange-400 dark:hover:border-orange-500'
            }`}
        >
          Rejected
        </button>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 border-l-4 border-orange-500 text-orange-700 dark:text-orange-400 px-5 py-4 rounded-r-xl shadow-glow-orange">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-200 dark:border-brand-900 border-t-cyan-500 dark:border-t-cyan-400"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-brand opacity-20 blur-xl animate-pulse-glow"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">Loading KYC documents...</p>
        </div>
      ) : (
        <div className="card elevated overflow-hidden border border-brand-400/20">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-navy-700">
              <thead className="bg-gradient-to-r from-navy-900 via-brand-900/50 to-navy-900 dark:from-navy-950 dark:via-brand-950/50 dark:to-navy-950">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">User Details</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Contact Info</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Uploaded</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-navy-900 divide-y divide-gray-200 dark:divide-navy-700">
                {records?.data && records.data.length > 0 ? (
                  records.data.map((user) => (
                    <tr key={user.id} className="hover:bg-brand-50 dark:hover:bg-brand-950/10 transition-all duration-200 group">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: {user.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">{user.email || '-'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{user.mobileNumber}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {user.documents.length > 0 ? new Date(user.documents[0].uploadedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4">{renderStatusBadge(user)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {(() => {
                          const pendingDocs = user.documents.filter((doc) => !doc.isVerified && !doc.rejectedAt).length;
                          const verifiedDocs = user.documents.filter((doc) => doc.isVerified).length;
                          const rejectedDocs = user.documents.filter((doc) => doc.rejectedAt).length;
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
                                onClick={() => openUserDetail(user)}
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
                        <ShieldCheck className="w-12 h-12 text-gray-300 dark:text-navy-600 mb-3" />
                        <p>No KYC records found matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {records && records.pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-800/50">
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  Showing <span className="font-bold">{(page - 1) * limit + 1}</span> to <span className="font-bold">{Math.min(page * limit, records.pagination.total)}</span> of <span className="font-bold">{records.pagination.total}</span> records
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="p-2 border border-gray-300 dark:border-navy-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-navy-700 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= records.pagination.totalPages}
                    className="p-2 border border-gray-300 dark:border-navy-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-navy-700 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {selectedUser && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4 py-6">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeUserDetail}
          ></div>
          <div className="relative z-50 w-full max-w-4xl bg-white dark:bg-navy-900 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-100 dark:border-navy-700">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">KYC Review</p>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedUser.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {selectedUser.email || 'No email provided'} • {selectedUser.mobileNumber}
                </p>
              </div>
              <button
                onClick={closeUserDetail}
                className="p-2 rounded-full bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-800/40">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">User ID</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{selectedUser.id}</p>
                </div>
                <div className="p-4 rounded-2xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-800/40">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Pending Document Types</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedUser.pendingDocuments.length > 0 ? (
                      selectedUser.pendingDocuments.map((doc) => (
                        <span
                          key={doc}
                          className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200"
                        >
                          {doc}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-green-600 dark:text-green-400">All required documents uploaded</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Documents</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Review each document before verifying</p>
                  </div>
                  {selectedUser.documents.filter((doc) => !doc.isVerified && !doc.rejectedAt).length > 0 && (
                    <button
                      onClick={handleBulkVerifySelectedUser}
                      disabled={detailActionLoading}
                      className="flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {detailActionLoading ? 'Verifying…' : 'Verify All Pending'}
                    </button>
                  )}
                </div>

                {selectedUser.documents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedUser.documents.map((doc) => {
                      const isVerified = doc.isVerified;
                      return (
                        <div
                          key={doc.id}
                          className="p-4 rounded-2xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 shadow-sm"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{doc.documentName}</p>
                              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{doc.documentType}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                              </p>
                              {isVerified && doc.verifiedAt && (
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
                                className="flex items-center px-3 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-500 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-all"
                              >
                                <ExternalLink className="w-3 h-3 mr-1.5" />
                                View
                              </a>
                              {!doc.isVerified ? (
                                <>
                                  <button
                                    onClick={() => handleVerify(doc.id)}
                                    className="flex items-center px-3 py-1.5 text-xs font-semibold text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500 rounded-lg hover:bg-green-50 dark:hover:bg-green-500/10 transition-all"
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1.5" />
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleReject(doc.id)}
                                    className="flex items-center px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                                  >
                                    <XCircle className="w-3 h-3 mr-1.5" />
                                    Reject
                                  </button>
                                  <button
                                    onClick={() => handleDelete(doc.id)}
                                    className="flex items-center px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500/10 transition-all"
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
                                    className="flex items-center px-3 py-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all"
                                  >
                                    <RotateCcw className="w-3 h-3 mr-1.5" />
                                    Revoke
                                  </button>
                                  <button
                                    onClick={() => handleDelete(doc.id)}
                                    className="flex items-center px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500/10 transition-all"
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
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl border border-dashed border-gray-300 dark:border-navy-700 text-center space-y-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No documents uploaded for this user.</p>
                    <div className="flex flex-wrap justify-center gap-3">
                      <button
                        onClick={() => handleAcceptUserWithoutDocuments(selectedUser.id)}
                        className="flex items-center px-4 py-2 text-sm font-semibold text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500 rounded-xl hover:bg-green-50 dark:hover:bg-green-500/10 transition-all"
                      >
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        Accept User
                      </button>
                      <button
                        onClick={() => handleRejectUserWithoutDocuments(selectedUser.id)}
                        className="flex items-center px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                      >
                        <XCircle className="w-4 h-4 mr-1.5" />
                        Reject User
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

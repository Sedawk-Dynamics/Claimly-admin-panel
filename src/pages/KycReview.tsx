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
  Filter,
} from 'lucide-react';

type ReviewStatus = 'pending' | 'verified' | 're-verification' | 'rejected';

export default function KycReview() {
  const [records, setRecords] = useState<PaginatedResponse<KycUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 25;

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

  const renderStatusBadge = (user: KycUser) => {
    const totalDocs = user.documents.length;
    const verifiedDocs = user.documents.filter((doc) => doc.isVerified).length;
    const rejectedDocs = user.documents.filter((doc) => doc.rejectedAt).length;

    if (rejectedDocs > 0) {
      return <span className="badge badge-danger"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>;
    }
    if (verifiedDocs === totalDocs && totalDocs > 0) {
      return <span className="badge badge-success"><CheckCircle className="w-3 h-3 mr-1" /> Verified</span>;
    }
    if (verifiedDocs > 0) {
      return <span className="badge badge-warning"><Clock className="w-3 h-3 mr-1" /> Partially Verified</span>;
    }
    return <span className="badge badge-warning"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
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
          onClick={() => { setStatusFilter('re-verification'); setPage(1); }}
          className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${statusFilter === 're-verification'
            ? 'bg-gradient-to-r from-purple-400 to-purple-500 text-white shadow-glow-purple'
            : 'bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-700 hover:border-purple-400 dark:hover:border-purple-500'
            }`}
        >
          Re-verification
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
                        <div className="space-y-2">
                          {user.documents.map((doc) => {
                            const isVerified = doc.isVerified;
                            return (
                              <div key={doc.id} className="flex flex-col gap-2 p-3 rounded-lg bg-gray-50 dark:bg-navy-900/50 border border-gray-100 dark:border-navy-700">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <div className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{doc.documentName}</div>
                                  </div>
                                  <div className="text-[10px] uppercase text-gray-500 dark:text-gray-400 font-medium">{doc.documentType}</div>
                                  {isVerified && doc.verifiedAt && (
                                    <div className="text-[10px] text-green-600 dark:text-green-400 mt-0.5">
                                      {new Date(doc.verifiedAt).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center px-3 py-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-navy-800 rounded-lg transition-all border border-transparent hover:border-brand-200 dark:hover:border-navy-600">
                                    <ExternalLink className="w-3 h-3 mr-1.5" /> View
                                  </a>
                                  {!doc.isVerified ? (
                                    <>
                                      <button onClick={() => handleVerify(doc.id)} className="flex items-center px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-navy-800 rounded-lg transition-all border border-transparent hover:border-green-200 dark:hover:border-navy-600">
                                        <CheckCircle className="w-3 h-3 mr-1.5" /> Accept
                                      </button>
                                      <button onClick={() => handleReject(doc.id)} className="flex items-center px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-navy-800 rounded-lg transition-all border border-transparent hover:border-red-200 dark:hover:border-navy-600">
                                        <XCircle className="w-3 h-3 mr-1.5" /> Reject
                                      </button>
                                    </>
                                  ) : (
                                    <button onClick={() => handleRemoveVerification(doc.id)} className="flex items-center px-3 py-1.5 text-xs font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-navy-800 rounded-lg transition-all border border-transparent hover:border-orange-200 dark:hover:border-navy-600">
                                      <RotateCcw className="w-3 h-3 mr-1.5" /> Revoke
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {user.documents.length === 0 && (
                            <div className="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-navy-900/50 rounded-lg border border-gray-200 dark:border-navy-600">
                              <div className="text-xs text-gray-500 dark:text-gray-400">No documents uploaded</div>
                              <div className="flex flex-wrap items-center gap-2">
                                <button onClick={() => handleAcceptUserWithoutDocuments(user.id)} className="flex items-center px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-navy-800 rounded-lg transition-all border border-transparent hover:border-green-200 dark:hover:border-navy-600">
                                  <CheckCircle className="w-3 h-3 mr-1.5" /> Accept
                                </button>
                                <button onClick={() => handleRejectUserWithoutDocuments(user.id)} className="flex items-center px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-navy-800 rounded-lg transition-all border border-transparent hover:border-red-200 dark:hover:border-navy-600">
                                  <XCircle className="w-3 h-3 mr-1.5" /> Reject
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
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
    </div>
  );
}

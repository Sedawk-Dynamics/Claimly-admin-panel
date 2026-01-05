import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/admin.service';
import { PolicyUser, PaginatedResponse } from '../types';
import {
  FileText,
  ExternalLink,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  XCircle,
  RotateCcw,
  Search,
  Building2,
  Eye,
  X,
  Trash2,
  UserPlus,
  ShieldCheck,
  User,
} from 'lucide-react';

type ReviewStatus = 'pending' | 'verified' | 'rejected' | 'draft' | 'all';

export default function PolicyReview() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<PaginatedResponse<PolicyUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 25;
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyUser | null>(null);
  const [detailActionLoading, setDetailActionLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPolicies();
    }, searchQuery ? 500 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, searchQuery]);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      setError('');
      const search = searchQuery.trim() || undefined;
      const data = await adminService.getPolicyDocuments(page, limit, statusFilter, search);
      setRecords(data);
      setSelectedPolicy((prev) => {
        if (!prev) {
          return prev;
        }
        return data.data.find((policy) => policy.id === prev.id) || null;
      });
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load policy documents');
      setRecords({ data: [], pagination: { page: 1, limit, total: 0, totalPages: 1 } });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadPolicies();
  };

  const handleVerify = async (documentId: string) => {
    if (!selectedPolicy) return;
    
    // Check if all nominees are verified before allowing policy document verification
    if (selectedPolicy.nominees && selectedPolicy.nominees.length > 0) {
      const unverifiedNominees = selectedPolicy.nominees.filter((n) => !n.nominee.isVerified);
      if (unverifiedNominees.length > 0) {
        alert(`Cannot verify policy document. ${unverifiedNominees.length} nominee(s) are not verified. Please verify all nominee documents first.`);
        return;
      }
    }
    
    try {
      await adminService.verifyPolicyDocument(documentId);
      loadPolicies();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to verify document');
    }
  };

  const handleReject = async (documentId: string) => {
    if (!confirm('Are you sure you want to reject this document?')) return;
    try {
      await adminService.rejectPolicyDocument(documentId);
      loadPolicies();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject document');
    }
  };

  const handleRemoveVerification = async (documentId: string) => {
    if (!confirm('Are you sure you want to remove verification from this document?')) return;
    try {
      await adminService.rejectPolicyDocument(documentId);
      loadPolicies();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove verification');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) return;
    try {
      await adminService.deletePolicyDocument(documentId);
      loadPolicies();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete document');
    }
  };

  const handleAcceptPolicyWithoutDocuments = async (policyId: string) => {
    if (!confirm('Are you sure you want to accept this policy without documents?')) return;
    try {
      await adminService.acceptPolicyWithoutDocuments(policyId);
      loadPolicies();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to accept policy');
    }
  };

  const handleRejectPolicyWithoutDocuments = async (policyId: string) => {
    if (!confirm('Are you sure you want to reject this policy without documents?')) return;
    try {
      await adminService.rejectPolicyWithoutDocuments(policyId);
      loadPolicies();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject policy');
    }
  };

  const openPolicyDetail = (policy: PolicyUser) => {
    setSelectedPolicy(policy);
  };

  const closePolicyDetail = () => {
    setSelectedPolicy(null);
  };

  const handleDeletePolicy = async (policyId: string) => {
    if (!confirm('Are you sure you want to delete this policy? This will permanently delete the policy and all associated documents. This action cannot be undone.')) return;
    try {
      await adminService.deletePolicy(policyId);
      alert('Policy deleted successfully');
      setSelectedPolicy(null);
      loadPolicies();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete policy');
    }
  };

  const handleVerifyNomineeDocument = async (documentId: string) => {
    try {
      await adminService.verifyNomineeDocument(documentId);
      loadPolicies();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to verify nominee document');
    }
  };

  const handleRejectNomineeDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to reject this nominee document?')) return;
    try {
      await adminService.rejectNomineeDocument(documentId);
      loadPolicies();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject nominee document');
    }
  };

  const handleDeleteNomineeDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this nominee document? This action cannot be undone.')) return;
    try {
      await adminService.deleteNomineeDocument(documentId);
      loadPolicies();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete nominee document');
    }
  };

  const handleBulkVerifySelectedPolicy = async () => {
    if (!selectedPolicy) {
      return;
    }

    // Check if all nominees are verified
    if (selectedPolicy.nominees && selectedPolicy.nominees.length > 0) {
      const unverifiedNominees = selectedPolicy.nominees.filter((n) => !n.nominee.isVerified);
      if (unverifiedNominees.length > 0) {
        alert(`Cannot verify policy. ${unverifiedNominees.length} nominee(s) are not verified. Please verify all nominee documents first.`);
        return;
      }
    }

    const documentsToVerify = selectedPolicy.documents.filter(
      (doc) => !doc.isVerified && !doc.rejectedAt
    );

    if (documentsToVerify.length === 0) {
      alert('No pending documents to verify for this policy.');
      return;
    }

    try {
      setDetailActionLoading(true);
      for (const doc of documentsToVerify) {
        await adminService.verifyPolicyDocument(doc.id);
      }
      await loadPolicies();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to verify pending documents');
    } finally {
      setDetailActionLoading(false);
    }
  };

  const renderStatusBadge = (policy: PolicyUser) => {
    // Use the status field from API if available (this reflects backend status including nominee verification)
    if (policy.status) {
      switch (policy.status) {
        case 'REJECTED':
          return (
            <span className="badge badge-danger">
              <XCircle className="w-3 h-3 mr-1" /> Rejected
            </span>
          );
        case 'ACCEPTED':
          return (
            <span className="badge badge-success">
              <CheckCircle className="w-3 h-3 mr-1" /> Verified
            </span>
          );
        case 'DRAFT':
          return (
            <span className="badge badge-info">
              <Clock className="w-3 h-3 mr-1" /> Draft
            </span>
          );
        case 'PENDING':
        default:
          return (
            <span className="badge badge-warning">
              <Clock className="w-3 h-3 mr-1" /> Pending
            </span>
          );
      }
    }

    // Fallback to manual calculation if status is not available
    const totalDocs = policy.documents.length;
    const verifiedDocs = policy.documents.filter(d => d.isVerified && d.verifiedAt);
    const rejectedDocs = policy.documents.filter(d => d.rejectedAt);
    
    // Show Rejected only if ALL documents are rejected
    if (rejectedDocs.length === totalDocs && totalDocs > 0) {
      return (
        <span className="badge badge-danger">
          <XCircle className="w-3 h-3 mr-1" /> Rejected
        </span>
      );
    }
    // Show Verified only if ALL documents are verified
    if (verifiedDocs.length === totalDocs && totalDocs > 0) {
      return (
        <span className="badge badge-success">
          <CheckCircle className="w-3 h-3 mr-1" /> Verified
        </span>
      );
    }
    // Show Pending if ANY document is not verified (includes partially verified cases)
    return (
      <span className="badge badge-warning">
        <Clock className="w-3 h-3 mr-1" /> Pending
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-brand rounded-xl blur-lg opacity-60 animate-pulse-glow"></div>
            <div className="relative p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-glow-brand">
              <FileText className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-brand">Policy Review</h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Review and verify policy documents</p>
          </div>
        </div>
        <button
          onClick={loadPolicies}
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
              placeholder="Search policies..."
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
          <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse text-sm sm:text-base">Loading policy documents...</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block card elevated overflow-hidden border border-brand-400/20">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-navy-700">
                <thead className="bg-gradient-to-r from-navy-900 via-brand-900/50 to-navy-900 dark:from-navy-950 dark:via-brand-950/50 dark:to-navy-950">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Policy Details</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">User Information</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Sum Assured</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Uploaded</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-navy-900 divide-y divide-gray-200 dark:divide-navy-700">
                  {records?.data && records.data.length > 0 ? (
                    records.data.map(policy => (
                      <tr key={policy.id} className="hover:bg-brand-50 dark:hover:bg-brand-950/10 transition-all duration-200 group">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-br from-brand-100 to-cyan-100 dark:from-brand-900/30 dark:to-cyan-900/30 rounded-lg group-hover:scale-110 transition-transform">
                              <FileText className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-gray-900 dark:text-white break-words">{policy.policyNumber}</div>
                              <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                                <Building2 className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="break-words">{policy.insuranceCompany.name}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900 dark:text-white break-words">{policy.user.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{policy.user.email || '-'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{policy.user.mobileNumber}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">₹{parseFloat(policy.sumAssured).toLocaleString('en-IN')}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {policy.documents.length > 0 ? new Date(policy.documents[0].uploadedAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4">{renderStatusBadge(policy)}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {(() => {
                            const pendingDocs = policy.documents.filter((doc) => !doc.isVerified && !doc.rejectedAt).length;
                            const verifiedDocs = policy.documents.filter((doc) => doc.isVerified).length;
                            const rejectedDocs = policy.documents.filter((doc) => doc.rejectedAt).length;
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
                                  onClick={() => openPolicyDetail(policy)}
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
                      <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center justify-center">
                          <FileText className="w-12 h-12 text-gray-300 dark:text-navy-600 mb-3" />
                          <p>No policies found matching your criteria.</p>
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
                  Showing <span className="font-bold">{(page - 1) * limit + 1}</span> to <span className="font-bold">{Math.min(page * limit, records.pagination.total)}</span> of <span className="font-bold">{records.pagination.total}</span> policies
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
              records.data.map(policy => {
                const pendingDocs = policy.documents.filter((doc) => !doc.isVerified && !doc.rejectedAt).length;
                const verifiedDocs = policy.documents.filter((doc) => doc.isVerified).length;
                const rejectedDocs = policy.documents.filter((doc) => doc.rejectedAt).length;
                return (
                  <div
                    key={policy.id}
                    className="card p-4 sm:p-5 border border-brand-400/20 hover:border-brand-400/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="p-2 bg-gradient-to-br from-brand-100 to-cyan-100 dark:from-brand-900/30 dark:to-cyan-900/30 rounded-lg flex-shrink-0">
                          <FileText className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white break-words">{policy.policyNumber}</div>
                          <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <Building2 className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="break-words">{policy.insuranceCompany.name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {renderStatusBadge(policy)}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-start space-x-2">
                        <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {policy.user.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {policy.user.email || 'No email'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {policy.user.mobileNumber}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Sum Assured: <span className="font-bold">₹{parseFloat(policy.sumAssured).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      {policy.documents.length > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Uploaded: {new Date(policy.documents[0].uploadedAt).toLocaleDateString()}
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
                      onClick={() => openPolicyDetail(policy)}
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
                  <FileText className="w-12 h-12 text-gray-300 dark:text-navy-600 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No policies found matching your criteria.</p>
                </div>
              </div>
            )}

            {/* Pagination */}
            {records && records.pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 card p-3 sm:p-4 border border-brand-400/20">
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 text-center sm:text-left">
                  Showing <span className="font-bold">{(page - 1) * limit + 1}</span> to <span className="font-bold">{Math.min(page * limit, records.pagination.total)}</span> of <span className="font-bold">{records.pagination.total}</span> policies
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
      {selectedPolicy && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm"
            onClick={closePolicyDetail}
          ></div>
          <div className="relative z-50 w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl bg-white dark:bg-navy-900 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh] m-3 sm:m-4 md:m-6 mt-4 sm:mt-6 md:mt-8 mb-4 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 p-4 sm:p-6 border-b border-gray-100 dark:border-navy-700">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Policy Review</p>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{selectedPolicy.policyNumber}</h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 break-words">
                  {selectedPolicy.insuranceCompany.name} • Added {new Date(selectedPolicy.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => navigate(`/users/${selectedPolicy.user.id}`)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-500 rounded-lg sm:rounded-xl hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-all"
                  title="View all user details"
                >
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">View User Details</span>
                  <span className="sm:hidden">View User</span>
                </button>
                <button
                  onClick={closePolicyDetail}
                  className="p-2 rounded-full bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-700 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
              {/* Policy Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-800/40">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Policy Number</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mt-1 break-words">{selectedPolicy.policyNumber}</p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-800/40">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Sum Assured</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mt-1">
                    ₹{parseFloat(selectedPolicy.sumAssured).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-800/40">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {selectedPolicy.status === 'ACCEPTED' ? (
                      <span className="text-green-600 dark:text-green-400">Accepted</span>
                    ) : selectedPolicy.status === 'REJECTED' ? (
                      <span className="text-red-600 dark:text-red-400">Rejected</span>
                    ) : selectedPolicy.status === 'PENDING' ? (
                      <span className="text-yellow-600 dark:text-yellow-400">Pending</span>
                    ) : (
                      <span className="text-gray-600 dark:text-gray-400">Draft</span>
                    )}
                  </p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-800/40">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Insurance Company</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mt-1 break-words">{selectedPolicy.insuranceCompany.name}</p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-800/40">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">User</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mt-1 break-words">{selectedPolicy.user.name}</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 break-words">{selectedPolicy.user.email || 'No email'}</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 break-words">{selectedPolicy.user.mobileNumber}</p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-800/40">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Uploaded At</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mt-1">
                    {new Date(selectedPolicy.uploadedAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(selectedPolicy.uploadedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Linked Nominees */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center flex-wrap">
                      <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-brand-500 flex-shrink-0" />
                      <span>Linked Nominees ({selectedPolicy.nominees?.length || 0})</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Nominees linked to this policy</p>
                  </div>
                </div>
                {selectedPolicy.nominees && selectedPolicy.nominees.length > 0 ? (
                  <div className="space-y-3">
                    {selectedPolicy.nominees.map((nomineeLink) => (
                      <div
                        key={nomineeLink.id}
                        className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 shadow-sm"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h4 className="text-base font-bold text-gray-900 dark:text-white">{nomineeLink.nominee.name}</h4>
                              {nomineeLink.nominee.isVerified ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400">
                                  <ShieldCheck className="w-3 h-3 mr-1" />
                                  Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Not Verified
                                </span>
                              )}
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400">
                                {nomineeLink.sharePercentage}% Share
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Relationship: </span>
                                <span className="font-semibold text-gray-900 dark:text-white">{nomineeLink.nominee.relationship}</span>
                              </div>
                              {nomineeLink.nominee.mobileNumber && (
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Mobile: </span>
                                  <span className="font-semibold text-gray-900 dark:text-white">{nomineeLink.nominee.mobileNumber}</span>
                                </div>
                              )}
                              {nomineeLink.nominee.email && (
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Email: </span>
                                  <span className="font-semibold text-gray-900 dark:text-white">{nomineeLink.nominee.email}</span>
                                </div>
                              )}
                              {nomineeLink.nominee.dob && (
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">DOB: </span>
                                  <span className="font-semibold text-gray-900 dark:text-white">
                                    {new Date(nomineeLink.nominee.dob).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Status: </span>
                                <span className={`font-semibold ${
                                  nomineeLink.nominee.status === 'ACCEPTED' ? 'text-green-600 dark:text-green-400' :
                                  nomineeLink.nominee.status === 'REJECTED' ? 'text-red-600 dark:text-red-400' :
                                  nomineeLink.nominee.status === 'PENDING' ? 'text-yellow-600 dark:text-yellow-400' :
                                  'text-gray-600 dark:text-gray-400'
                                }`}>
                                  {nomineeLink.nominee.status}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Documents: </span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {nomineeLink.nominee.verifiedDocumentsCount} / {nomineeLink.nominee.documentsCount} Verified
                                </span>
                              </div>
                            </div>
                            {nomineeLink.nominee.address && (
                              <div className="mt-2 text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Address: </span>
                                <span className="font-semibold text-gray-900 dark:text-white">{nomineeLink.nominee.address}</span>
                              </div>
                            )}
                            
                            {/* Nominee Documents */}
                            {nomineeLink.nominee.documents && nomineeLink.nominee.documents.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-navy-700">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Nominee Documents</p>
                                <div className="space-y-2">
                                  {nomineeLink.nominee.documents.map((doc) => (
                                    <div
                                      key={doc.id}
                                      className="p-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-900/50"
                                    >
                                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex-1">
                                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{doc.documentName}</p>
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
                                                onClick={() => handleVerifyNomineeDocument(doc.id)}
                                                className="flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500 rounded-lg hover:bg-green-50 dark:hover:bg-green-500/10 transition-all flex-1 sm:flex-none"
                                              >
                                                <CheckCircle className="w-3 h-3 mr-1.5" />
                                                Accept
                                              </button>
                                              <button
                                                onClick={() => handleRejectNomineeDocument(doc.id)}
                                                className="flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex-1 sm:flex-none"
                                              >
                                                <XCircle className="w-3 h-3 mr-1.5" />
                                                Reject
                                              </button>
                                              <button
                                                onClick={() => handleDeleteNomineeDocument(doc.id)}
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
                                                onClick={() => handleRejectNomineeDocument(doc.id)}
                                                className="flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all flex-1 sm:flex-none"
                                              >
                                                <RotateCcw className="w-3 h-3 mr-1.5" />
                                                Remove Verification
                                              </button>
                                              <button
                                                onClick={() => handleDeleteNomineeDocument(doc.id)}
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
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl border border-dashed border-gray-300 dark:border-navy-700 text-center">
                    <UserPlus className="w-12 h-12 text-gray-300 dark:text-navy-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No nominees linked to this policy</p>
                  </div>
                )}
              </div>

              {/* Policy Documents */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Documents</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Verify policy uploads before approval</p>
                  </div>
                  {selectedPolicy.documents.filter((doc) => !doc.isVerified && !doc.rejectedAt).length > 0 && (
                    <button
                      onClick={handleBulkVerifySelectedPolicy}
                      disabled={detailActionLoading}
                      className="flex items-center justify-center px-3 sm:px-4 py-2 text-sm sm:text-base rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-lg disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {detailActionLoading ? 'Verifying…' : 'Verify All Pending'}
                    </button>
                  )}
                </div>

                {selectedPolicy.documents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedPolicy.documents.map((doc) => (
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
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">No documents uploaded for this policy.</p>
                    <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-3">
                      <button
                        onClick={() => handleAcceptPolicyWithoutDocuments(selectedPolicy.id)}
                        className="flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500 rounded-xl hover:bg-green-50 dark:hover:bg-green-500/10 transition-all w-full sm:w-auto"
                      >
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        Accept Policy
                      </button>
                      <button
                        onClick={() => handleRejectPolicyWithoutDocuments(selectedPolicy.id)}
                        className="flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all w-full sm:w-auto"
                      >
                        <XCircle className="w-4 h-4 mr-1.5" />
                        Reject Policy
                      </button>
                    </div>
                  </div>
                )}
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-navy-700">
                  <button
                    onClick={() => handleDeletePolicy(selectedPolicy.id)}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-red-500/50 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Policy
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

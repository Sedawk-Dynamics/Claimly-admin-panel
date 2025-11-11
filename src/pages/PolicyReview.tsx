import { useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';
import { PolicyUser, PaginatedResponse } from '../types';
import {
  FileText,
  ExternalLink,
  CheckCircle,
  Loader2,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  XCircle,
  RotateCcw,
  Search,
  User,
  DollarSign,
  Building2,
  Phone,
  Mail,
} from 'lucide-react';

type ReviewStatus = 'pending' | 'verified' | 're-verification' | 'rejected';

export default function PolicyReview() {
  const [records, setRecords] = useState<PaginatedResponse<PolicyUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 25;

  useEffect(() => {
    // Debounce search query to avoid too many API calls
    const timer = setTimeout(() => {
      loadPolicies();
    }, searchQuery ? 500 : 0); // Wait 500ms after user stops typing, but immediate if clearing search

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
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load policy documents');
      setRecords({
        data: [],
        pagination: { page: 1, limit, total: 0, totalPages: 1 },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1); // Reset to first page when search changes
  };

  const handleVerify = async (documentId: string) => {
    try {
      await adminService.verifyPolicyDocument(documentId);
      loadPolicies();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to verify document');
    }
  };

  const handleReject = async (documentId: string) => {
    if (!confirm('Are you sure you want to reject this document?')) {
      return;
    }
    try {
      await adminService.rejectPolicyDocument(documentId);
      loadPolicies();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject document');
    }
  };

  const handleRemoveVerification = async (documentId: string) => {
    if (!confirm('Are you sure you want to remove verification from this document?')) {
      return;
    }
    try {
      await adminService.rejectPolicyDocument(documentId);
      loadPolicies();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove verification');
    }
  };

  const renderStatusBadge = (policy: PolicyUser) => {
    const totalDocs = policy.documents.length;
    const verifiedDocs = policy.documents.filter((doc) => doc.isVerified && doc.verifiedAt);
    const rejectedDocs = policy.documents.filter((doc) => doc.rejectedAt !== null && doc.rejectedAt !== undefined);
    const verifiedCount = verifiedDocs.length;
    
    if (verifiedCount === totalDocs && totalDocs > 0) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
          <CheckCircle className="w-4 h-4 mr-1" />
          Verified
        </span>
      );
    }

    if (rejectedDocs.length > 0) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
          <XCircle className="w-4 h-4 mr-1" />
          Has Rejected Documents
        </span>
      );
    }

    if (verifiedCount > 0) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
          <Clock className="w-4 h-4 mr-1" />
          Partially Verified
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
        <Clock className="w-4 h-4 mr-1" />
        Pending Verification
      </span>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FileText className="w-7 h-7 mr-3 text-primary-600" />
            Policy Review
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Review and verify policy documents submitted by users. Re-verification includes policies that were previously verified but have new unverified documents.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or policy number..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value as ReviewStatus);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="pending">Pending Verification</option>
            <option value="re-verification">Re-verification</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={loadPolicies}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-100 transition"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading policy documents...
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Policy Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Information
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sum Assured
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records?.data && records.data.length > 0 ? (
                records.data.map((policy) => (
                  <tr key={policy.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-primary-600" />
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{policy.policyNumber}</div>
                          <div className="flex items-center mt-1 text-xs text-gray-600">
                            <Building2 className="w-3 h-3 mr-1" />
                            {policy.insuranceCompany.name}
                          </div>
                          {statusFilter === 'verified' && policy.documents.length > 0 && (
                            <div className="mt-1 text-xs text-green-600">
                              Last verified: {(() => {
                                const verifiedDates = policy.documents
                                  .filter(doc => doc.isVerified)
                                  .map(doc => doc.verifiedAt)
                                  .filter((date): date is string => date != null)
                                  .map(date => new Date(date).getTime())
                                  .sort((a, b) => b - a);
                                if (verifiedDates.length > 0) {
                                  return new Date(verifiedDates[0]).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  });
                                }
                                return 'N/A';
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-2">
                        <User className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{policy.user.name}</div>
                          <div className="flex items-center mt-1 text-xs text-gray-600">
                            {policy.user.email && (
                              <>
                                <Mail className="w-3 h-3 mr-1" />
                                <span className="mr-3">{policy.user.email}</span>
                              </>
                            )}
                            {policy.user.mobileNumber && (
                              <>
                                <Phone className="w-3 h-3 mr-1" />
                                <span>{policy.user.mobileNumber}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <div>
                          <div className="text-lg font-bold text-gray-900">
                            ₹{parseFloat(policy.sumAssured).toLocaleString('en-IN')}
                          </div>
                          <div className="text-xs text-gray-500">Sum Assured</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {policy.documents.length > 0
                        ? new Date(policy.documents[0].uploadedAt).toLocaleString()
                        : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{renderStatusBadge(policy)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="space-y-2">
                        {policy.documents.map((doc) => {
                          const isReverification = statusFilter === 're-verification';
                          const isRejected = statusFilter === 'rejected';
                          const isVerified = statusFilter === 'verified';
                          const hasVerifiedAt = doc.verifiedAt !== null && doc.verifiedAt !== undefined;
                          const policyHasVerifiedDocs = policy.verifiedDocuments && policy.verifiedDocuments.length > 0;
                          
                          // Determine if document is actually rejected (has rejectedAt set)
                          const isActuallyRejected = doc.rejectedAt !== null && doc.rejectedAt !== undefined;
                          
                          return (
                            <div key={doc.id} className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-medium">{doc.documentName}</div>
                                  {isReverification && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                      <RotateCcw className="w-3 h-3 mr-1" />
                                      Re-verification
                                    </span>
                                  )}
                                  {isRejected && isActuallyRejected && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Rejected
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs uppercase text-gray-500">{doc.documentType}</div>
                                {isVerified && doc.isVerified && hasVerifiedAt && doc.verifiedAt && (
                                  <div className="text-xs text-green-600 mt-1">
                                    Verified on: {new Date(doc.verifiedAt).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                )}
                                {isReverification && hasVerifiedAt && doc.verifiedAt && (
                                  <div className="text-xs text-orange-600 mt-1">
                                    Previously verified: {new Date(doc.verifiedAt).toLocaleDateString()}
                                  </div>
                                )}
                                {isReverification && !hasVerifiedAt && policyHasVerifiedDocs && (
                                  <div className="text-xs text-orange-600 mt-1">
                                    New document from verified policy
                                  </div>
                                )}
                                {isRejected && isActuallyRejected && doc.rejectedAt && (
                                  <div className="text-xs text-red-600 mt-1">
                                    Rejected on: {new Date(doc.rejectedAt).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-3">
                                <a
                                  href={doc.documentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-primary-600 hover:text-primary-700"
                                >
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  View
                                </a>
                                {!doc.isVerified ? (
                                  <>
                                    <button
                                      onClick={() => handleVerify(doc.id)}
                                      className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Accept
                                    </button>
                                    <button
                                      onClick={() => handleReject(doc.id)}
                                      className="inline-flex items-center text-red-600 hover:text-red-700 font-medium"
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Reject
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => handleRemoveVerification(doc.id)}
                                    className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium"
                                  >
                                    <RotateCcw className="w-4 h-4 mr-1" />
                                    Remove Verification
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {policy.documents.length === 0 && (
                          <div className="text-xs text-gray-500">No documents uploaded</div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No policies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {records && records.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing {((page - 1) * limit) + 1} to{' '}
                {Math.min(page * limit, records.pagination.total)} of{' '}
                {records.pagination.total} policies
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= records.pagination.totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

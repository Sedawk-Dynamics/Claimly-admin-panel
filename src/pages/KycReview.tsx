import { useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';
import { KycUser, PaginatedResponse } from '../types';
import {
  ShieldCheck,
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
} from 'lucide-react';

type ReviewStatus = 'pending' | 'verified' | 're-verification';

const REQUIRED_DOCUMENT_TYPES: Array<'AADHAAR' | 'PAN'> = ['AADHAAR', 'PAN'];

export default function KycReview() {
  const [records, setRecords] = useState<PaginatedResponse<KycUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 25;

  useEffect(() => {
    // Debounce search query to avoid too many API calls
    const timer = setTimeout(() => {
      loadDocuments();
    }, searchQuery ? 500 : 0); // Wait 500ms after user stops typing, but immediate if clearing search

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, searchQuery]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      const search = searchQuery.trim() || undefined;
      const data = await adminService.getKycDocuments(page, limit, statusFilter, search);
      setRecords(data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load KYC documents');
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
      await adminService.verifyKycDocument(documentId);
      loadDocuments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to verify document');
    }
  };

  const handleReject = async (documentId: string) => {
    if (!confirm('Are you sure you want to reject this document?')) {
      return;
    }
    try {
      await adminService.rejectKycDocument(documentId);
      loadDocuments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject document');
    }
  };

  const handleRemoveVerification = async (documentId: string) => {
    if (!confirm('Are you sure you want to remove verification from this document?')) {
      return;
    }
    try {
      await adminService.rejectKycDocument(documentId);
      loadDocuments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove verification');
    }
  };

  const renderStatusBadge = (user: KycUser) => {
    const totalDocs = user.documents.length;
    const verifiedDocs = user.documents.filter((doc) => doc.isVerified).length;
    if (verifiedDocs === totalDocs && totalDocs > 0) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
          <CheckCircle className="w-4 h-4 mr-1" />
          Verified
        </span>
      );
    }

    if (verifiedDocs > 0) {
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
            <ShieldCheck className="w-7 h-7 mr-3 text-primary-600" />
            KYC Review
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Review and verify Aadhaar and PAN documents submitted by users. Re-verification includes users who were previously verified but uploaded new documents.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
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
          </select>
          <button
            onClick={loadDocuments}
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
          Loading KYC documents...
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
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
                records.data.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email || 'No email'}</div>
                      <div className="text-xs text-gray-400">{user.mobileNumber}</div>
                      {user.pendingDocuments.length > 0 && (
                        <div className="mt-1 text-xs text-yellow-700">
                          Missing: {user.pendingDocuments.join(', ')}
                        </div>
                      )}
                      {statusFilter === 'verified' && user.documents.length > 0 && (
                        <div className="mt-1 text-xs text-green-600">
                          Last verified: {(() => {
                            const verifiedDates = user.documents
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.documents.length > 0
                        ? new Date(user.documents[0].uploadedAt).toLocaleString()
                        : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{renderStatusBadge(user)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="space-y-2">
                        {user.documents.map((doc) => {
                          // When filter is 're-verification', all documents shown are re-verification documents
                          // They are either:
                          // 1. Documents with verified_at (previously verified document that was updated)
                          // 2. New documents from users who already have all required documents verified
                          const isReverification = statusFilter === 're-verification';
                          const isVerified = statusFilter === 'verified';
                          const hasVerifiedAt = doc.verifiedAt !== null && doc.verifiedAt !== undefined;
                          const userHasAllVerified = user.verifiedDocuments && user.verifiedDocuments.length >= REQUIRED_DOCUMENT_TYPES.length;
                          
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
                                {isReverification && !hasVerifiedAt && userHasAllVerified && (
                                  <div className="text-xs text-orange-600 mt-1">
                                    New document from verified user
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
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No documents found.
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
                {records.pagination.total} users
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



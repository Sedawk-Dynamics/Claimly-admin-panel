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
} from 'lucide-react';

type ReviewStatus = 'pending' | 'verified';

export default function KycReview() {
  const [records, setRecords] = useState<PaginatedResponse<KycUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus>('pending');
  const limit = 10;

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getKycDocuments(page, limit, statusFilter);
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

  const handleVerify = async (documentId: string) => {
    try {
      await adminService.verifyKycDocument(documentId);
      loadDocuments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to verify document');
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
            Review and verify Aadhaar and PAN documents submitted by users.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value as ReviewStatus);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="pending">Pending Verification</option>
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.documents.length > 0
                        ? new Date(user.documents[0].uploadedAt).toLocaleString()
                        : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{renderStatusBadge(user)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="space-y-2">
                        {user.documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium">{doc.documentName}</div>
                              <div className="text-xs uppercase text-gray-500">{doc.documentType}</div>
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
                              {!doc.isVerified && (
                                <button
                                  onClick={() => handleVerify(doc.id)}
                                  className="inline-flex items-center text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Verify
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
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



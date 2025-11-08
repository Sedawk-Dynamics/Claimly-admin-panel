import { useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';
import { Alert, PaginatedResponse } from '../types';
import { ChevronLeft, ChevronRight, Bell, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function Alerts() {
  const [alerts, setAlerts] = useState<PaginatedResponse<Alert> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'VERIFIED' | 'FALSE_ALERT' | undefined>(undefined);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'VERIFIED' | 'FALSE_ALERT'>('VERIFIED');
  const [remarks, setRemarks] = useState('');
  const limit = 20;

  useEffect(() => {
    loadAlerts();
  }, [page, statusFilter]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getAlerts(page, limit, statusFilter);
      // Ensure data has the expected structure
      if (data && data.data && Array.isArray(data.data)) {
        setAlerts(data);
      } else {
        setAlerts({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
        setError('Invalid response format from server');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load alerts');
      setAlerts({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (alert: Alert) => {
    setSelectedAlert(alert);
    setVerificationStatus(alert.verificationStatus === 'FALSE_ALERT' ? 'FALSE_ALERT' : 'VERIFIED');
    setRemarks(alert.remarks || '');
    setShowVerifyModal(true);
  };

  const handleSubmitVerification = async () => {
    if (!selectedAlert) return;
    try {
      await adminService.verifyAlert(selectedAlert.id, {
        verificationStatus,
        remarks: remarks || undefined,
      });
      setShowVerifyModal(false);
      setSelectedAlert(null);
      loadAlerts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to verify alert');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'FALSE_ALERT':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-100 text-green-800';
      case 'FALSE_ALERT':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
      </div>

      {/* Filters */}
      <div className="mb-6 flex space-x-4">
        <button
          onClick={() => setStatusFilter(undefined)}
          className={`px-4 py-2 rounded-lg ${
            statusFilter === undefined ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`px-4 py-2 rounded-lg ${
            statusFilter === 'PENDING' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setStatusFilter('VERIFIED')}
          className={`px-4 py-2 rounded-lg ${
            statusFilter === 'VERIFIED' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'
          }`}
        >
          Verified
        </button>
        <button
          onClick={() => setStatusFilter('FALSE_ALERT')}
          className={`px-4 py-2 rounded-lg ${
            statusFilter === 'FALSE_ALERT' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'
          }`}
        >
          False Alerts
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alert
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {alerts?.data && alerts.data.length > 0 ? (
                  alerts.data.map((alert) => (
                    <tr key={alert.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <Bell className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{alert.detectedVia}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {format(new Date(alert.detectionDate), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {alert.user?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {alert.user?.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(alert.verificationStatus)}
                        <span
                          className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            alert.verificationStatus
                          )}`}
                        >
                          {alert.verificationStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(alert.createdAt), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(alert.createdAt), 'hh:mm a')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {alert.verificationStatus === 'PENDING' && (
                        <button
                          onClick={() => handleVerify(alert)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Verify
                        </button>
                      )}
                      {alert.verificationStatus !== 'PENDING' && (
                        <button
                          onClick={() => handleVerify(alert)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                      No alerts found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {alerts && alerts.pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, alerts.pagination.total)} of{' '}
                {alerts.pagination.total} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= alerts.pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Verify Modal */}
      {showVerifyModal && selectedAlert && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Verify Alert</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Detected Via:</strong> {selectedAlert.detectedVia}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Detection Date:</strong> {format(new Date(selectedAlert.detectionDate), 'MMM dd, yyyy')}
              </p>
              {selectedAlert.user && (
                <p className="text-sm text-gray-600 mb-2">
                  <strong>User:</strong> {selectedAlert.user.name}
                </p>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verification Status</label>
                <select
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value as 'VERIFIED' | 'FALSE_ALERT')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="VERIFIED">Verified</option>
                  <option value="FALSE_ALERT">False Alert</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Add remarks (optional)"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSubmitVerification}
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700"
                >
                  Submit
                </button>
                <button
                  onClick={() => {
                    setShowVerifyModal(false);
                    setSelectedAlert(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


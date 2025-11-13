import { useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';
import { Alert, PaginatedResponse, AlertStats } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Calendar,
  UserPlus,
  FileText,
  Users,
  CreditCard,
  Download,
  CheckSquare,
  Square,
} from 'lucide-react';
import { format } from 'date-fns';

export default function Alerts() {
  const [alerts, setAlerts] = useState<PaginatedResponse<Alert> | null>(null);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'VERIFIED' | 'FALSE_ALERT' | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [detectedViaFilter, setDetectedViaFilter] = useState<'SMS' | 'MANUAL' | undefined>(undefined);
  const [alertTypeFilter, setAlertTypeFilter] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'VERIFIED' | 'FALSE_ALERT'>('VERIFIED');
  const [remarks, setRemarks] = useState('');
  const limit = 20;

  useEffect(() => {
    loadAlerts();
    loadStats();
  }, [page, statusFilter, detectedViaFilter, alertTypeFilter, startDate, endDate]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getAlerts(
        page,
        limit,
        statusFilter,
        searchTerm || undefined,
        detectedViaFilter,
        startDate || undefined,
        endDate || undefined
      );
      if (data && data.data && Array.isArray(data.data)) {
        // Filter by alert type on frontend if needed
        if (alertTypeFilter) {
          const filtered = data.data.filter((alert) => alert.alertType === alertTypeFilter);
          setAlerts({ ...data, data: filtered, pagination: { ...data.pagination, total: filtered.length } });
        } else {
          setAlerts(data);
        }
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

  const loadStats = async () => {
    try {
      const data = await adminService.getAlertStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadAlerts();
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
      setSelectedAlerts(new Set());
      loadAlerts();
      loadStats();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to verify alert');
    }
  };

  const handleBulkVerify = async () => {
    if (selectedAlerts.size === 0) {
      alert('Please select at least one alert');
      return;
    }
    if (!confirm(`Verify ${selectedAlerts.size} selected alert(s)?`)) return;

    try {
      await adminService.bulkVerifyAlerts(Array.from(selectedAlerts), {
        verificationStatus,
        remarks: remarks || undefined,
      });
      setSelectedAlerts(new Set());
      setRemarks('');
      loadAlerts();
      loadStats();
      alert('Alerts verified successfully');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to verify alerts');
    }
  };

  const toggleSelectAlert = (alertId: string) => {
    const newSelected = new Set(selectedAlerts);
    if (newSelected.has(alertId)) {
      newSelected.delete(alertId);
    } else {
      newSelected.add(alertId);
    }
    setSelectedAlerts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedAlerts.size === alerts?.data.length) {
      setSelectedAlerts(new Set());
    } else {
      setSelectedAlerts(new Set(alerts?.data.map((a) => a.id) || []));
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

  const getAlertTypeIcon = (type?: string) => {
    switch (type) {
      case 'NEW_USER':
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'NEW_POLICY':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'NEW_NOMINEE':
        return <Users className="w-4 h-4 text-purple-500" />;
      case 'SUBSCRIPTION':
        return <CreditCard className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAlertTypeLabel = (type?: string) => {
    switch (type) {
      case 'NEW_USER':
        return 'New User';
      case 'NEW_POLICY':
        return 'New Policy';
      case 'NEW_NOMINEE':
        return 'New Nominee';
      case 'SUBSCRIPTION':
        return 'Subscription';
      default:
        return 'Other';
    }
  };

  const exportToCSV = () => {
    if (!alerts?.data.length) return;

    const headers = ['ID', 'Type', 'User', 'Email', 'Mobile', 'Status', 'Detected Via', 'Remarks', 'Created At'];
    const rows = alerts.data.map((alert) => [
      alert.id,
      getAlertTypeLabel(alert.alertType),
      alert.user?.name || 'N/A',
      alert.user?.email || 'N/A',
      alert.user?.mobileNumber || 'N/A',
      alert.verificationStatus,
      alert.detectedVia,
      alert.remarks || '',
      format(new Date(alert.createdAt), 'yyyy-MM-dd HH:mm:ss'),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alerts-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
        <div className="flex space-x-2">
          {selectedAlerts.size > 0 && (
            <button
              onClick={handleBulkVerify}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Bulk Verify ({selectedAlerts.size})
            </button>
          )}
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Total Alerts</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Verified</div>
            <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">False Alerts</div>
            <div className="text-2xl font-bold text-red-600">{stats.falseAlerts}</div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user name, email, mobile, or remarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Search
            </button>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Detection Method</label>
              <select
                value={detectedViaFilter || ''}
                onChange={(e) => {
                  setDetectedViaFilter((e.target.value as 'SMS' | 'MANUAL' | '') || undefined);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All</option>
                <option value="SMS">SMS</option>
                <option value="MANUAL">Manual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alert Type</label>
              <select
                value={alertTypeFilter || ''}
                onChange={(e) => {
                  setAlertTypeFilter(e.target.value || undefined);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Types</option>
                <option value="NEW_USER">New User</option>
                <option value="NEW_POLICY">New Policy</option>
                <option value="NEW_NOMINEE">New Nominee</option>
                <option value="SUBSCRIPTION">Subscription</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Filters */}
      <div className="mb-6 flex space-x-4">
        <button
          onClick={() => {
            setStatusFilter(undefined);
            setPage(1);
          }}
          className={`px-4 py-2 rounded-lg ${
            statusFilter === undefined ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'
          }`}
        >
          All
        </button>
        <button
          onClick={() => {
            setStatusFilter('PENDING');
            setPage(1);
          }}
          className={`px-4 py-2 rounded-lg ${
            statusFilter === 'PENDING' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => {
            setStatusFilter('VERIFIED');
            setPage(1);
          }}
          className={`px-4 py-2 rounded-lg ${
            statusFilter === 'VERIFIED' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'
          }`}
        >
          Verified
        </button>
        <button
          onClick={() => {
            setStatusFilter('FALSE_ALERT');
            setPage(1);
          }}
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
                  <th className="px-6 py-3 text-left">
                    <button onClick={toggleSelectAll} className="flex items-center">
                      {selectedAlerts.size === alerts?.data.length && alerts.data.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-primary-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </th>
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
                        <button onClick={() => toggleSelectAlert(alert.id)}>
                          {selectedAlerts.has(alert.id) ? (
                            <CheckSquare className="w-5 h-5 text-primary-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          {getAlertTypeIcon(alert.alertType)}
                          <div className="ml-2">
                            <div className="text-sm font-medium text-gray-900">
                              {getAlertTypeLabel(alert.alertType)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{alert.detectedVia}</div>
                            {alert.remarks && (
                              <div className="text-xs text-gray-400 mt-1 line-clamp-1">{alert.remarks}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{alert.user?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{alert.user?.email || 'N/A'}</div>
                        <div className="text-xs text-gray-400">{alert.user?.mobileNumber || 'N/A'}</div>
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
                        <button
                          onClick={() => handleVerify(alert)}
                          className={`${
                            alert.verificationStatus === 'PENDING'
                              ? 'text-primary-600 hover:text-primary-900'
                              : 'text-blue-600 hover:text-blue-900'
                          }`}
                        >
                          {alert.verificationStatus === 'PENDING' ? 'Verify' : 'Edit'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
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
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {selectedAlert.verificationStatus === 'PENDING' ? 'Verify Alert' : 'Edit Alert Verification'}
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Type:</strong> {getAlertTypeLabel(selectedAlert.alertType)}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Detected Via:</strong> {selectedAlert.detectedVia}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Detection Date:</strong> {format(new Date(selectedAlert.detectionDate), 'MMM dd, yyyy')}
              </p>
              {selectedAlert.user && (
                <>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>User:</strong> {selectedAlert.user.name}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Email:</strong> {selectedAlert.user.email}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Mobile:</strong> {selectedAlert.user.mobileNumber}
                  </p>
                </>
              )}
              {selectedAlert.remarks && (
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Current Remarks:</strong> {selectedAlert.remarks}
                </p>
              )}
              {selectedAlert.verificationStatus !== 'PENDING' && (
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Current Status:</strong> {selectedAlert.verificationStatus}
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

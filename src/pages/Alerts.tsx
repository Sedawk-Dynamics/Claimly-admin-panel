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
  UserPlus,
  FileText,
  Users,
  CreditCard,
  Download,
  CheckSquare,
  Square,
  Zap,
  MessageSquare,
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
        return <CheckCircle className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />;
      case 'FALSE_ALERT':
        return <XCircle className="w-5 h-5 text-orange-500 dark:text-orange-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'status-active';
      case 'FALSE_ALERT':
        return 'status-expired';
      case 'PENDING':
        return 'status-inactive';
      default:
        return 'badge';
    }
  };

  const getAlertTypeIcon = (type?: string) => {
    switch (type) {
      case 'NEW_USER':
        return <UserPlus className="w-4 h-4 text-brand-500 dark:text-brand-400" />;
      case 'NEW_POLICY':
        return <FileText className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />;
      case 'NEW_NOMINEE':
        return <Users className="w-4 h-4 text-orange-500 dark:text-orange-400" />;
      case 'SUBSCRIPTION':
        return <CreditCard className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-fire rounded-xl blur-lg opacity-60 animate-pulse-glow-orange"></div>
            <div className="relative p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-glow-yellow">
              <Zap className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gradient-fire">Alerts</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Monitor and verify system alerts</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedAlerts.size > 0 && (
            <button
              onClick={handleBulkVerify}
              className="btn-brand flex items-center space-x-2"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Bulk Verify ({selectedAlerts.size})</span>
            </button>
          )}
          <button
            onClick={exportToCSV}
            className="btn-outline-orange flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Total Alerts"
            value={stats.total}
            icon={Bell}
            gradient="brand"
            description="All time"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={AlertCircle}
            gradient="yellow"
            description="Needs review"
          />
          <StatCard
            title="Verified"
            value={stats.verified}
            icon={CheckCircle}
            gradient="cyan"
            description="Confirmed"
          />
          <StatCard
            title="False Alerts"
            value={stats.falseAlerts}
            icon={XCircle}
            gradient="fire"
            description="Dismissed"
          />
        </div>
      )}

      {/* Search and Filters */}
      <div className="card p-5 border border-cyan-400/20">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cyan-500 dark:text-cyan-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by user name, email, mobile, or remarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline-brand flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-navy-700 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Detection Method</label>
              <select
                value={detectedViaFilter || ''}
                onChange={(e) => {
                  setDetectedViaFilter((e.target.value as 'SMS' | 'MANUAL' | '') || undefined);
                  setPage(1);
                }}
                className="input-elegant w-full"
              >
                <option value="">All</option>
                <option value="SMS">SMS</option>
                <option value="MANUAL">Manual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Alert Type</label>
              <select
                value={alertTypeFilter || ''}
                onChange={(e) => {
                  setAlertTypeFilter(e.target.value || undefined);
                  setPage(1);
                }}
                className="input-elegant w-full"
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
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="input-elegant flex-1"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="input-elegant flex-1"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => {
            setStatusFilter(undefined);
            setPage(1);
          }}
          className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${statusFilter === undefined
            ? 'bg-gradient-brand text-white shadow-glow-brand'
            : 'bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-700 hover:border-brand-400 dark:hover:border-brand-500'
            }`}
        >
          All
        </button>
        <button
          onClick={() => {
            setStatusFilter('PENDING');
            setPage(1);
          }}
          className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${statusFilter === 'PENDING'
            ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-glow-yellow'
            : 'bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-700 hover:border-yellow-400 dark:hover:border-yellow-500'
            }`}
        >
          Pending
        </button>
        <button
          onClick={() => {
            setStatusFilter('VERIFIED');
            setPage(1);
          }}
          className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${statusFilter === 'VERIFIED'
            ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-white shadow-glow-cyan'
            : 'bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-700 hover:border-cyan-400 dark:hover:border-cyan-500'
            }`}
        >
          Verified
        </button>
        <button
          onClick={() => {
            setStatusFilter('FALSE_ALERT');
            setPage(1);
          }}
          className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${statusFilter === 'FALSE_ALERT'
            ? 'bg-gradient-sunset text-white shadow-glow-orange'
            : 'bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-700 hover:border-orange-400 dark:hover:border-orange-500'
            }`}
        >
          False Alerts
        </button>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 border-2 border-orange-400 dark:border-orange-500 text-orange-700 dark:text-orange-400 px-5 py-4 rounded-xl shadow-glow-orange">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-200 dark:border-yellow-900 border-t-orange-500 dark:border-t-orange-400"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-fire opacity-20 blur-xl animate-pulse-glow-orange"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">Loading alerts...</p>
        </div>
      ) : (
        <>
          <div className="card elevated overflow-hidden border border-yellow-400/20">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-navy-700">
              <thead className="bg-gradient-to-r from-navy-900 via-yellow-900/50 to-navy-900 dark:from-navy-950 dark:via-yellow-950/50 dark:to-navy-950">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <button onClick={toggleSelectAll} className="flex items-center">
                      {selectedAlerts.size === alerts?.data.length && alerts.data.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-yellow-400" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">
                    Alert
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-navy-900 divide-y divide-gray-200 dark:divide-navy-700">
                {alerts?.data && alerts.data.length > 0 ? (
                  alerts.data.map((alert) => (
                    <tr key={alert.id} className="hover:bg-yellow-50 dark:hover:bg-yellow-950/10 transition-all duration-200 group">
                      <td className="px-6 py-4">
                        <button onClick={() => toggleSelectAlert(alert.id)}>
                          {selectedAlerts.has(alert.id) ? (
                            <CheckSquare className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-lg group-hover:scale-110 transition-transform">
                            {getAlertTypeIcon(alert.alertType)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              {getAlertTypeLabel(alert.alertType)}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{alert.detectedVia}</div>
                            {alert.smsText && (
                              <div className="flex items-start mt-1 space-x-1">
                                <MessageSquare className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                <span className="text-xs text-gray-500 dark:text-gray-500 line-clamp-1 italic">"{alert.smsText}"</span>
                              </div>
                            )}
                            {alert.remarks && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-1">{alert.remarks}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{alert.user?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{alert.user?.email || 'N/A'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">{alert.user?.mobileNumber || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(alert.verificationStatus)}
                          <span className={getStatusColor(alert.verificationStatus)}>
                            {alert.verificationStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {format(new Date(alert.createdAt), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(alert.createdAt), 'hh:mm a')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleVerify(alert)}
                          className="text-brand-600 dark:text-cyan-400 hover:text-white dark:hover:text-white hover:bg-gradient-brand dark:hover:bg-gradient-cyan px-3 py-1.5 rounded-lg transition-all font-semibold"
                        >
                          {alert.verificationStatus === 'PENDING' ? 'Verify' : 'Edit'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-navy-800 dark:to-navy-900 rounded-2xl">
                          <Bell className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">No alerts found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {alerts && alerts.pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 card p-4 sm:p-5 border border-yellow-400/20">
              <div className="text-sm text-gray-700 dark:text-gray-300 text-center sm:text-left">
                Showing <span className="font-bold text-yellow-500 dark:text-yellow-400">{((page - 1) * limit) + 1}</span> to{' '}
                <span className="font-bold text-yellow-500 dark:text-yellow-400">{Math.min(page * limit, alerts.pagination.total)}</span> of{' '}
                <span className="font-bold text-yellow-500 dark:text-yellow-400">{alerts.pagination.total}</span> results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2.5 border-2 border-yellow-400 dark:border-yellow-500 text-yellow-500 dark:text-yellow-400 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-yellow-400 hover:to-orange-500 hover:text-white hover:border-transparent transition-all font-semibold disabled:hover:bg-transparent disabled:hover:text-yellow-500 dark:disabled:hover:text-yellow-400 hover:scale-105"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= alerts.pagination.totalPages}
                  className="px-4 py-2.5 border-2 border-yellow-400 dark:border-yellow-500 text-yellow-500 dark:text-yellow-400 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-yellow-400 hover:to-orange-500 hover:text-white hover:border-transparent transition-all font-semibold disabled:hover:bg-transparent disabled:hover:text-yellow-500 dark:disabled:hover:text-yellow-400 hover:scale-105"
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
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm overflow-y-auto h-full w-full z-50 p-4 flex items-center justify-center">
          <div className="relative card border-2 border-yellow-400/30 dark:border-yellow-500/30 w-full max-w-md shadow-2xl shadow-yellow-500/20">
            <h3 className="text-xl font-bold text-gradient-fire mb-4">
              {selectedAlert.verificationStatus === 'PENDING' ? 'Verify Alert' : 'Edit Alert Verification'}
            </h3>
            <div className="mb-4 space-y-3 p-4 bg-gray-50 dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-navy-700">
              <div className="flex items-start space-x-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[100px]">Type:</span>
                <span className="text-sm text-gray-900 dark:text-white">{getAlertTypeLabel(selectedAlert.alertType)}</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[100px]">Detected Via:</span>
                <span className="text-sm text-gray-900 dark:text-white">{selectedAlert.detectedVia}</span>
              </div>
              {selectedAlert.smsText && (
                <div className="flex items-start space-x-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[100px]">SMS Text:</span>
                  <div className="flex-1 bg-gray-100 dark:bg-navy-900 p-2 rounded-lg">
                    <span className="text-sm text-gray-800 dark:text-gray-200 italic">"{selectedAlert.smsText}"</span>
                  </div>
                </div>
              )}
              <div className="flex items-start space-x-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[100px]">Date:</span>
                <span className="text-sm text-gray-900 dark:text-white">{format(new Date(selectedAlert.detectionDate), 'MMM dd, yyyy')}</span>
              </div>
              {selectedAlert.user && (
                <>
                  <div className="flex items-start space-x-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[100px]">User:</span>
                    <span className="text-sm text-gray-900 dark:text-white">{selectedAlert.user.name}</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[100px]">Email:</span>
                    <span className="text-sm text-gray-900 dark:text-white">{selectedAlert.user.email}</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[100px]">Mobile:</span>
                    <span className="text-sm text-gray-900 dark:text-white">{selectedAlert.user.mobileNumber}</span>
                  </div>
                </>
              )}
              {selectedAlert.remarks && (
                <div className="flex items-start space-x-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[100px]">Remarks:</span>
                  <span className="text-sm text-gray-900 dark:text-white">{selectedAlert.remarks}</span>
                </div>
              )}
              {selectedAlert.verificationStatus !== 'PENDING' && (
                <div className="flex items-start space-x-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[100px]">Status:</span>
                  <span className={getStatusColor(selectedAlert.verificationStatus)}>{selectedAlert.verificationStatus}</span>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Verification Status</label>
                <select
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value as 'VERIFIED' | 'FALSE_ALERT')}
                  className="input-elegant w-full"
                >
                  <option value="VERIFIED">Verified</option>
                  <option value="FALSE_ALERT">False Alert</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="input-elegant w-full"
                  rows={3}
                  placeholder="Add remarks (optional)"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSubmitVerification}
                  className="flex-1 btn-brand"
                >
                  Submit
                </button>
                <button
                  onClick={() => {
                    setShowVerifyModal(false);
                    setSelectedAlert(null);
                  }}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-semibold"
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

function StatCard({
  title,
  value,
  icon: Icon,
  gradient,
  description,
}: {
  title: string;
  value: number;
  icon: any;
  gradient: 'brand' | 'cyan' | 'sunset' | 'fire' | 'yellow';
  description?: string;
}) {
  const getGradientColor = (type: string) => {
    switch (type) {
      case 'brand': return 'from-brand-500 to-cyan-400';
      case 'cyan': return 'from-cyan-400 to-blue-500';
      case 'sunset': return 'from-orange-400 to-pink-500';
      case 'fire': return 'from-red-500 to-orange-500';
      case 'yellow': return 'from-yellow-400 to-orange-400';
      default: return 'from-brand-500 to-cyan-400';
    }
  };

  const getShadowColor = (type: string) => {
    switch (type) {
      case 'brand': return 'shadow-brand-500/20';
      case 'cyan': return 'shadow-cyan-500/20';
      case 'sunset': return 'shadow-orange-500/20';
      case 'fire': return 'shadow-red-500/20';
      case 'yellow': return 'shadow-yellow-500/20';
      default: return 'shadow-brand-500/20';
    }
  };

  const getTextColor = (type: string) => {
    switch (type) {
      case 'brand': return 'text-brand-600 dark:text-brand-400';
      case 'cyan': return 'text-cyan-600 dark:text-cyan-400';
      case 'sunset': return 'text-orange-600 dark:text-orange-400';
      case 'fire': return 'text-red-600 dark:text-red-400';
      case 'yellow': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-brand-600 dark:text-brand-400';
    }
  };

  return (
    <div className={`card p-6 border-l-4 ${gradient === 'brand' ? 'border-brand-500' :
      gradient === 'cyan' ? 'border-cyan-500' :
        gradient === 'sunset' ? 'border-orange-500' :
          gradient === 'fire' ? 'border-red-500' :
            'border-yellow-500'
      } hover:translate-y-[-2px] transition-all duration-300`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {value.toLocaleString()}
          </h3>
          {description && (
            <p className={`text-xs mt-1 ${getTextColor(gradient)} font-medium flex items-center`}>
              {description}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${getGradientColor(gradient)} shadow-lg ${getShadowColor(gradient)} text-white`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

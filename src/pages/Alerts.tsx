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
  CheckSquare,
  Square,
  Zap,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import TruncatedText from '../components/TruncatedText';

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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAlertForDetail, setSelectedAlertForDetail] = useState<Alert | null>(null);
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

  const handleViewAlert = (alert: Alert) => {
    setSelectedAlertForDetail(alert);
    setShowDetailModal(true);
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

  const handleDeleteAlert = async (alertItem: Alert) => {
    if (!confirm(`Are you sure you want to delete this alert? This action cannot be undone.`)) return;

    try {
      await adminService.deleteAlert(alertItem.id);
      loadAlerts();
      loadStats();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete alert');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-fire rounded-xl blur-lg opacity-60 animate-pulse-glow-orange"></div>
            <div className="relative p-2 sm:p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-glow-yellow">
              <Zap className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-fire">Alerts</h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Monitor and verify system alerts</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedAlerts.size > 0 && (
            <button
              onClick={handleBulkVerify}
              className="btn-brand flex items-center justify-center space-x-2 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Bulk Verify ({selectedAlerts.size})</span>
            </button>
          )}
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
      <div className="card p-4 sm:p-5 border border-cyan-400/20">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-cyan-500 dark:text-cyan-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-cyan-400/30 dark:border-cyan-500/30 rounded-xl bg-white dark:bg-navy-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-400 dark:focus:ring-cyan-500 focus:border-cyan-400 dark:focus:border-cyan-500 transition-all duration-300 placeholder:text-gray-400"
            />
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={handleSearch}
              className="btn-cyan flex-1 sm:flex-none text-sm sm:text-base px-4 sm:px-6"
            >
              Search
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-outline-brand flex items-center justify-center space-x-2 flex-1 sm:flex-none text-sm sm:text-base px-4 sm:px-6"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden xs:inline">Filters</span>
              <span className="xs:hidden">Filter</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-navy-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Detection Method</label>
              <select
                value={detectedViaFilter || ''}
                onChange={(e) => {
                  setDetectedViaFilter((e.target.value as 'SMS' | 'MANUAL' | '') || undefined);
                  setPage(1);
                }}
                className="input-elegant w-full text-sm sm:text-base"
              >
                <option value="">All</option>
                <option value="SMS">SMS</option>
                <option value="MANUAL">Manual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Alert Type</label>
              <select
                value={alertTypeFilter || ''}
                onChange={(e) => {
                  setAlertTypeFilter(e.target.value || undefined);
                  setPage(1);
                }}
                className="input-elegant w-full text-sm sm:text-base"
              >
                <option value="">All Types</option>
                <option value="NEW_USER">New User</option>
                <option value="NEW_POLICY">New Policy</option>
                <option value="NEW_NOMINEE">New Nominee</option>
                <option value="SUBSCRIPTION">Subscription</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="input-elegant flex-1 text-sm sm:text-base"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="input-elegant flex-1 text-sm sm:text-base"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <button
          onClick={() => {
            setStatusFilter(undefined);
            setPage(1);
          }}
          className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-sm sm:text-base transition-all ${statusFilter === undefined
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
          className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-sm sm:text-base transition-all ${statusFilter === 'PENDING'
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
          className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-sm sm:text-base transition-all ${statusFilter === 'VERIFIED'
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
          className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-sm sm:text-base transition-all ${statusFilter === 'FALSE_ALERT'
            ? 'bg-gradient-sunset text-white shadow-glow-orange'
            : 'bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-700 hover:border-orange-400 dark:hover:border-orange-500'
            }`}
        >
          False Alerts
        </button>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 border-2 border-orange-400 dark:border-orange-500 text-orange-700 dark:text-orange-400 px-4 sm:px-5 py-3 sm:py-4 rounded-xl shadow-glow-orange text-sm sm:text-base">
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
          {/* Desktop Table View */}
          <div className="hidden lg:block card elevated overflow-hidden border border-yellow-400/20">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 dark:divide-navy-700 table-fixed">
                <colgroup>
                  <col className="w-[5%]" />
                  <col className="w-[28%]" />
                  <col className="w-[22%]" />
                  <col className="w-[12%]" />
                  <col className="w-[13%]" />
                  <col className="w-[20%]" />
                </colgroup>
                <thead className="bg-gradient-to-r from-navy-900 via-yellow-900/50 to-navy-900 dark:from-navy-950 dark:via-yellow-950/50 dark:to-navy-950">
                  <tr>
                    <th className="px-3 py-4 text-left">
                      <button onClick={toggleSelectAll} className="flex items-center">
                        {selectedAlerts.size === alerts?.data.length && alerts.data.length > 0 ? (
                          <CheckSquare className="w-5 h-5 text-yellow-400" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">
                      Alert
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-navy-900 divide-y divide-gray-200 dark:divide-navy-700">
                  {alerts?.data && alerts.data.length > 0 ? (
                    alerts.data.map((alert) => (
                      <tr key={alert.id} className="hover:bg-yellow-50 dark:hover:bg-yellow-950/10 transition-all duration-200 group">
                        <td className="px-3 py-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => toggleSelectAlert(alert.id)}>
                            {selectedAlerts.has(alert.id) ? (
                              <CheckSquare className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-4 cursor-pointer overflow-hidden" onClick={() => handleViewAlert(alert)}>
                          <div className="flex items-start space-x-2 min-w-0">
                            <div className="p-1.5 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                              {getAlertTypeIcon(alert.alertType)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {getAlertTypeLabel(alert.alertType)}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">{alert.detectedVia}</div>
                              {alert.smsText && (
                                <div className="flex items-start mt-1 space-x-1 min-w-0">
                                  <MessageSquare className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                  <span className="text-xs text-gray-500 dark:text-gray-500 truncate italic">"{alert.smsText}"</span>
                                </div>
                              )}
                              {alert.remarks && (
                                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">{alert.remarks}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 cursor-pointer overflow-hidden" onClick={() => handleViewAlert(alert)}>
                          <div className="min-w-0 space-y-0.5">
                            <TruncatedText 
                              text={alert.user?.name || 'N/A'} 
                              maxLength={20}
                              className="text-sm font-medium text-gray-900 dark:text-white block"
                            />
                            <TruncatedText 
                              text={alert.user?.email || 'N/A'} 
                              maxLength={25}
                              className="text-sm text-gray-600 dark:text-gray-400 block"
                            />
                            <TruncatedText 
                              text={alert.user?.mobileNumber || 'N/A'} 
                              maxLength={15}
                              className="text-xs text-gray-500 dark:text-gray-500 block"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4 cursor-pointer overflow-hidden" onClick={() => handleViewAlert(alert)}>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(alert.verificationStatus)}
                            <span className={`${getStatusColor(alert.verificationStatus)} truncate`}>
                              {alert.verificationStatus}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 cursor-pointer overflow-hidden" onClick={() => handleViewAlert(alert)}>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {format(new Date(alert.createdAt), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {format(new Date(alert.createdAt), 'hh:mm a')}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-medium overflow-hidden" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleVerify(alert)}
                              className="text-brand-600 dark:text-cyan-400 hover:text-white dark:hover:text-white hover:bg-gradient-brand dark:hover:bg-gradient-cyan px-3 py-1.5 rounded-lg transition-all font-semibold"
                            >
                              {alert.verificationStatus === 'PENDING' ? 'Verify' : 'Edit'}
                            </button>
                            <button
                              onClick={() => handleDeleteAlert(alert)}
                              className="text-red-600 dark:text-red-400 hover:text-white dark:hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-orange-500 dark:hover:from-red-600 dark:hover:to-orange-600 px-3 py-1.5 rounded-lg transition-all font-semibold flex items-center space-x-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </div>
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
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden space-y-4">
            {alerts?.data && alerts.data.length > 0 ? (
              alerts.data.map((alert) => (
                <div
                  key={alert.id}
                  className="card p-4 sm:p-5 border border-yellow-400/20 hover:border-yellow-400/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectAlert(alert.id);
                        }}
                        className="flex-shrink-0 mt-1"
                      >
                        {selectedAlerts.has(alert.id) ? (
                          <CheckSquare className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <div
                        className="flex items-start space-x-3 flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleViewAlert(alert)}
                      >
                        <div className="p-2 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-lg flex-shrink-0">
                          {getAlertTypeIcon(alert.alertType)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-base font-bold text-gray-900 dark:text-white">
                            {getAlertTypeLabel(alert.alertType)}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{alert.detectedVia}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {getStatusIcon(alert.verificationStatus)}
                      <span className={`${getStatusColor(alert.verificationStatus)} text-xs`}>
                        {alert.verificationStatus}
                      </span>
                    </div>
                  </div>

                  <div
                    className="space-y-2 mb-4 cursor-pointer"
                    onClick={() => handleViewAlert(alert)}
                  >
                    {alert.user && (
                      <div className="flex items-start space-x-2">
                        <Users className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {alert.user.name || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {alert.user.email || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 truncate">
                            {alert.user.mobileNumber || 'N/A'}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {format(new Date(alert.createdAt), 'MMM dd, yyyy')} at {format(new Date(alert.createdAt), 'hh:mm a')}
                      </div>
                    </div>
                    {alert.smsText && (
                      <div className="flex items-start space-x-2 pt-2 border-t border-gray-200 dark:border-navy-700">
                        <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2 italic flex-1">
                          "{alert.smsText}"
                        </span>
                      </div>
                    )}
                    {alert.remarks && (
                      <div className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2 pt-2 border-t border-gray-200 dark:border-navy-700">
                        {alert.remarks}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-200 dark:border-navy-700" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleViewAlert(alert)}
                      className="flex-1 btn-brand text-sm py-2 flex items-center justify-center space-x-2"
                    >
                      <span>View Details</span>
                    </button>
                    <button
                      onClick={() => handleVerify(alert)}
                      className="flex-1 text-brand-600 dark:text-cyan-400 hover:text-white dark:hover:text-white hover:bg-gradient-brand dark:hover:bg-gradient-cyan px-3 py-2 rounded-lg transition-all font-semibold text-sm border border-brand-500 dark:border-cyan-500"
                    >
                      {alert.verificationStatus === 'PENDING' ? 'Verify' : 'Edit'}
                    </button>
                    <button
                      onClick={() => handleDeleteAlert(alert)}
                      className="flex-1 text-red-600 dark:text-red-400 hover:text-white dark:hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-orange-500 dark:hover:from-red-600 dark:hover:to-orange-600 px-3 py-2 rounded-lg transition-all font-semibold text-sm flex items-center justify-center space-x-1 border border-red-500 dark:border-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="card p-8 text-center border border-yellow-400/20">
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-navy-800 dark:to-navy-900 rounded-2xl">
                    <Bell className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">No alerts found</p>
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {alerts && alerts.pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 card p-3 sm:p-4 lg:p-5 border border-yellow-400/20">
              <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 text-center sm:text-left">
                Showing <span className="font-bold text-yellow-500 dark:text-yellow-400">{((page - 1) * limit) + 1}</span> to{' '}
                <span className="font-bold text-yellow-500 dark:text-yellow-400">{Math.min(page * limit, alerts.pagination.total)}</span> of{' '}
                <span className="font-bold text-yellow-500 dark:text-yellow-400">{alerts.pagination.total}</span> results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-yellow-400 dark:border-yellow-500 text-yellow-500 dark:text-yellow-400 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-yellow-400 hover:to-orange-500 hover:text-white hover:border-transparent transition-all font-semibold disabled:hover:bg-transparent disabled:hover:text-yellow-500 dark:disabled:hover:text-yellow-400 hover:scale-105"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= alerts.pagination.totalPages}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-yellow-400 dark:border-yellow-500 text-yellow-500 dark:text-yellow-400 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-yellow-400 hover:to-orange-500 hover:text-white hover:border-transparent transition-all font-semibold disabled:hover:bg-transparent disabled:hover:text-yellow-500 dark:disabled:hover:text-yellow-400 hover:scale-105"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Alert Detail Modal */}
      {showDetailModal && selectedAlertForDetail && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"></div>
          <div className="relative z-50 card border-2 border-yellow-400/30 dark:border-yellow-500/30 w-full max-w-md sm:max-w-lg shadow-2xl shadow-yellow-500/20 m-3 sm:m-4 md:m-6 mt-4 sm:mt-6 md:mt-8 mb-4 sm:mb-8 p-4 sm:p-5 md:p-6">
            <div className="flex items-start sm:items-center justify-between mb-4 sm:mb-5 gap-3">
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg sm:rounded-xl shadow-glow-yellow flex-shrink-0">
                  {getAlertTypeIcon(selectedAlertForDetail.alertType)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gradient-fire truncate">
                    Alert Details
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                    {getAlertTypeLabel(selectedAlertForDetail.alertType)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedAlertForDetail(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0 p-1"
              >
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {/* Alert Information */}
              <div className="p-3 sm:p-4 md:p-5 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-lg sm:rounded-xl border border-yellow-200 dark:border-yellow-800">
                <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center space-x-2">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                  <span>Alert Information</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">Alert ID</span>
                    <p className="text-xs sm:text-sm text-gray-900 dark:text-white font-mono mt-1 break-words">{selectedAlertForDetail.id}</p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">Alert Type</span>
                    <p className="text-xs sm:text-sm text-gray-900 dark:text-white mt-1 break-words">{getAlertTypeLabel(selectedAlertForDetail.alertType)}</p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">Detection Method</span>
                    <p className="text-xs sm:text-sm text-gray-900 dark:text-white mt-1 break-words">{selectedAlertForDetail.detectedVia}</p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">Verification Status</span>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusIcon(selectedAlertForDetail.verificationStatus)}
                      <span className={`${getStatusColor(selectedAlertForDetail.verificationStatus)} text-xs sm:text-sm`}>
                        {selectedAlertForDetail.verificationStatus}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">Detection Date</span>
                    <p className="text-xs sm:text-sm text-gray-900 dark:text-white mt-1 break-words">
                      {format(new Date(selectedAlertForDetail.detectionDate), 'MMM dd, yyyy hh:mm a')}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">Created At</span>
                    <p className="text-xs sm:text-sm text-gray-900 dark:text-white mt-1 break-words">
                      {format(new Date(selectedAlertForDetail.createdAt), 'MMM dd, yyyy hh:mm a')}
                    </p>
                  </div>
                </div>
              </div>

              {/* SMS Text */}
              {selectedAlertForDetail.smsText && (
                <div className="p-3 sm:p-4 md:p-5 bg-gray-50 dark:bg-navy-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-navy-700">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500" />
                    <span>SMS Text</span>
                  </h4>
                  <div className="bg-white dark:bg-navy-900 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-navy-700">
                    <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 italic leading-relaxed break-words">
                      "{selectedAlertForDetail.smsText}"
                    </p>
                  </div>
                </div>
              )}

              {/* User Information */}
              {selectedAlertForDetail.user && (
                <div className="p-3 sm:p-4 md:p-5 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg sm:rounded-xl border border-cyan-200 dark:border-cyan-800">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center space-x-2">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500" />
                    <span>User Information</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <span className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">Name</span>
                      <p className="text-xs sm:text-sm text-gray-900 dark:text-white mt-1 break-words">{selectedAlertForDetail.user.name}</p>
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">Email</span>
                      <p className="text-xs sm:text-sm text-gray-900 dark:text-white mt-1 break-words">{selectedAlertForDetail.user.email}</p>
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">Mobile Number</span>
                      <p className="text-xs sm:text-sm text-gray-900 dark:text-white mt-1 break-words">{selectedAlertForDetail.user.mobileNumber}</p>
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">User ID</span>
                      <p className="text-xs sm:text-sm text-gray-900 dark:text-white font-mono mt-1 break-words">{selectedAlertForDetail.user.id}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Remarks */}
              {selectedAlertForDetail.remarks && (
                <div className="p-3 sm:p-4 md:p-5 bg-gray-50 dark:bg-navy-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-navy-700">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 flex items-center space-x-2">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                    <span>Remarks</span>
                  </h4>
                  <div className="bg-white dark:bg-navy-900 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-navy-700">
                    <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
                      {selectedAlertForDetail.remarks}
                    </p>
                  </div>
                </div>
              )}

              {/* Verification Information */}
              {selectedAlertForDetail.verifiedBy && (
                <div className="p-3 sm:p-4 md:p-5 bg-green-50 dark:bg-green-950/20 rounded-lg sm:rounded-xl border border-green-200 dark:border-green-800">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    <span>Verification Information</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <span className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">Verified By</span>
                      <p className="text-xs sm:text-sm text-gray-900 dark:text-white mt-1 break-words">{selectedAlertForDetail.verifiedBy.name}</p>
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">Verifier Email</span>
                      <p className="text-xs sm:text-sm text-gray-900 dark:text-white mt-1 break-words">{selectedAlertForDetail.verifiedBy.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200 dark:border-navy-700">
                <button
                  onClick={() => {
                    handleVerify(selectedAlertForDetail);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 btn-brand text-sm sm:text-base py-2.5 sm:py-3"
                >
                  {selectedAlertForDetail.verificationStatus === 'PENDING' ? 'Verify Alert' : 'Edit Verification'}
                </button>
                <button
                  onClick={() => {
                    handleDeleteAlert(selectedAlertForDetail);
                    setShowDetailModal(false);
                    setSelectedAlertForDetail(null);
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white py-2.5 sm:py-3 rounded-lg transition-all font-semibold text-sm sm:text-base flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedAlertForDetail(null);
                  }}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 sm:py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-semibold text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verify Modal */}
      {showVerifyModal && selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"></div>
          <div className="relative z-50 card border-2 border-yellow-400/30 dark:border-yellow-500/30 w-full max-w-md sm:max-w-lg shadow-2xl shadow-yellow-500/20 m-3 sm:m-4 md:m-6 mt-4 sm:mt-6 md:mt-8 mb-4 sm:mb-8 p-4 sm:p-5 md:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gradient-fire mb-4 sm:mb-5">
              {selectedAlert.verificationStatus === 'PENDING' ? 'Verify Alert' : 'Edit Alert Verification'}
            </h3>
            <div className="mb-4 sm:mb-5 space-y-2 sm:space-y-3 p-3 sm:p-4 md:p-5 bg-gray-50 dark:bg-navy-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-navy-700">
              <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 sm:min-w-[100px]">Type:</span>
                <span className="text-xs sm:text-sm text-gray-900 dark:text-white break-words">{getAlertTypeLabel(selectedAlert.alertType)}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 sm:min-w-[100px]">Detected Via:</span>
                <span className="text-xs sm:text-sm text-gray-900 dark:text-white break-words">{selectedAlert.detectedVia}</span>
              </div>
              {selectedAlert.smsText && (
                <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 sm:min-w-[100px]">SMS Text:</span>
                  <div className="flex-1 bg-gray-100 dark:bg-navy-900 p-2 sm:p-3 rounded-lg">
                    <span className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 italic break-words">"{selectedAlert.smsText}"</span>
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 sm:min-w-[100px]">Date:</span>
                <span className="text-xs sm:text-sm text-gray-900 dark:text-white break-words">{format(new Date(selectedAlert.detectionDate), 'MMM dd, yyyy')}</span>
              </div>
              {selectedAlert.user && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 sm:min-w-[100px]">User:</span>
                    <span className="text-xs sm:text-sm text-gray-900 dark:text-white break-words">{selectedAlert.user.name}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 sm:min-w-[100px]">Email:</span>
                    <span className="text-xs sm:text-sm text-gray-900 dark:text-white break-words">{selectedAlert.user.email}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 sm:min-w-[100px]">Mobile:</span>
                    <span className="text-xs sm:text-sm text-gray-900 dark:text-white break-words">{selectedAlert.user.mobileNumber}</span>
                  </div>
                </>
              )}
              {selectedAlert.remarks && (
                <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 sm:min-w-[100px]">Remarks:</span>
                  <span className="text-xs sm:text-sm text-gray-900 dark:text-white break-words">{selectedAlert.remarks}</span>
                </div>
              )}
              {selectedAlert.verificationStatus !== 'PENDING' && (
                <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 sm:min-w-[100px]">Status:</span>
                  <span className={`${getStatusColor(selectedAlert.verificationStatus)} text-xs sm:text-sm`}>{selectedAlert.verificationStatus}</span>
                </div>
              )}
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Verification Status</label>
                <select
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value as 'VERIFIED' | 'FALSE_ALERT')}
                  className="input-elegant w-full text-sm sm:text-base"
                >
                  <option value="VERIFIED">Verified</option>
                  <option value="FALSE_ALERT">False Alert</option>
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="input-elegant w-full text-sm sm:text-base"
                  rows={3}
                  placeholder="Add remarks (optional)"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-3">
                <button
                  onClick={handleSubmitVerification}
                  className="flex-1 btn-brand text-sm sm:text-base py-2.5 sm:py-3"
                >
                  Submit
                </button>
                <button
                  onClick={() => {
                    setShowVerifyModal(false);
                    setSelectedAlert(null);
                  }}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 sm:py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-semibold text-sm sm:text-base"
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

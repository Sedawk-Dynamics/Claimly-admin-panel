import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, ExternalLink, Clock, FileText, CreditCard, UserPlus, UserCog, Shield, Upload, Edit, Trash2 } from 'lucide-react';
import { adminService } from '../services/admin.service';
import { UserDetail as AdminUserDetail, UserActivityLog, PaginatedResponse } from '../types';
import api from '../services/api';

const formatDate = (value?: string | Date | null) => {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : '-';
  return date.toLocaleString();
};

const formatEnumLabel = (value?: string | null) => {
  if (!value) return '-';
  return value.toString().toLowerCase().split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatCurrency = (value?: string | number | null) => {
  if (value === null || value === undefined) return '-';
  const amount = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(amount)) return value?.toString() || '-';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
};

const getDocumentStatusBadge = (isVerified: boolean, rejectedAt?: string | null) => {
  if (isVerified) {
    return <span className="badge badge-success"><CheckCircle className="w-3 h-3 mr-1" /> Accepted</span>;
  } else if (rejectedAt) {
    return <span className="badge badge-danger"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>;
  } else {
    return <span className="badge badge-warning"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
  }
};

const getActivityIcon = (activityType: string) => {
  const iconMap: Record<string, any> = {
    DOCUMENT_UPLOADED: Upload,
    DOCUMENT_UPDATED: Edit,
    SUBSCRIPTION_CREATED: CreditCard,
    SUBSCRIPTION_EXPIRED: XCircle,
    NOMINEE_ADDED: UserPlus,
    NOMINEE_UPDATED: UserCog,
    POLICY_ADDED: Shield,
    POLICY_DOCUMENT_UPLOADED: FileText,
    NOMINEE_DOCUMENT_UPLOADED: FileText,
  };
  return iconMap[activityType] || Clock;
};

const getActivityColor = (activityType: string) => {
  const colorMap: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
    DOCUMENT_UPLOADED: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', iconBg: 'bg-blue-100 dark:bg-blue-800' },
    DOCUMENT_UPDATED: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800', iconBg: 'bg-purple-100 dark:bg-purple-800' },
    SUBSCRIPTION_CREATED: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800', iconBg: 'bg-green-100 dark:bg-green-800' },
    SUBSCRIPTION_EXPIRED: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800', iconBg: 'bg-red-100 dark:bg-red-800' },
    NOMINEE_ADDED: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800', iconBg: 'bg-indigo-100 dark:bg-indigo-800' },
    NOMINEE_UPDATED: { bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800', iconBg: 'bg-cyan-100 dark:bg-cyan-800' },
    POLICY_ADDED: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', iconBg: 'bg-emerald-100 dark:bg-emerald-800' },
    POLICY_DOCUMENT_UPLOADED: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', iconBg: 'bg-amber-100 dark:bg-amber-800' },
    NOMINEE_DOCUMENT_UPLOADED: { bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-700 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800', iconBg: 'bg-pink-100 dark:bg-pink-800' },
  };
  return colorMap[activityType] || { bg: 'bg-gray-50 dark:bg-gray-800/50', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700', iconBg: 'bg-gray-100 dark:bg-gray-700' };
};

export default function UserDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState<string | null>(null);
  const [activityLogs, setActivityLogs] = useState<PaginatedResponse<UserActivityLog> | null>(null);
  const [activityLogsLoading, setActivityLogsLoading] = useState(false);
  const [activityLogsPage, setActivityLogsPage] = useState(1);
  const [deletingAllLogs, setDeletingAllLogs] = useState(false);

  const fetchUser = async () => {
    if (!id) {
      setError('User not found');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await adminService.getUserById(id);
      setUser(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load user details');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (id) fetchActivityLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, activityLogsPage]);

  const fetchActivityLogs = async () => {
    if (!id) return;
    try {
      setActivityLogsLoading(true);
      const data = await adminService.getUserActivityLogs(id, activityLogsPage, 50);
      setActivityLogs(data);
    } catch (err: any) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setActivityLogsLoading(false);
    }
  };

  const handleVerifyPolicyDocument = async (documentId: string) => {
    try {
      setVerifying(documentId);
      await adminService.verifyPolicyDocument(documentId);
      await fetchUser();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to verify document');
    } finally {
      setVerifying(null);
    }
  };

  const handleRejectPolicyDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to reject this policy document?')) return;
    try {
      setVerifying(documentId);
      await adminService.rejectPolicyDocument(documentId);
      await fetchUser();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject document');
    } finally {
      setVerifying(null);
    }
  };

  const handleVerifyNomineeDocument = async (documentId: string) => {
    try {
      setVerifying(documentId);
      await adminService.verifyNomineeDocument(documentId);
      await fetchUser();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to verify document');
    } finally {
      setVerifying(null);
    }
  };

  const handleRejectNomineeDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to reject this nominee document?')) return;
    try {
      setVerifying(documentId);
      await adminService.rejectNomineeDocument(documentId);
      await fetchUser();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject document');
    } finally {
      setVerifying(null);
    }
  };

  const handleRemoveNomineeVerification = async (documentId: string) => {
    if (!confirm('Are you sure you want to remove verification from this nominee document?')) return;
    try {
      setVerifying(documentId);
      await adminService.rejectNomineeDocument(documentId);
      await fetchUser();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove verification');
    } finally {
      setVerifying(null);
    }
  };

  const handleRemovePolicyVerification = async (documentId: string) => {
    if (!confirm('Are you sure you want to remove verification from this policy document?')) return;
    try {
      setVerifying(documentId);
      await adminService.rejectPolicyDocument(documentId);
      await fetchUser();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove verification');
    } finally {
      setVerifying(null);
    }
  };

  const handleVerifyUserDocument = async (documentId: string) => {
    try {
      setVerifying(documentId);
      await adminService.verifyUserDocument(documentId);
      await fetchUser();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to verify document');
    } finally {
      setVerifying(null);
    }
  };

  const handleRejectUserDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to reject this user document?')) return;
    try {
      setVerifying(documentId);
      await adminService.rejectUserDocument(documentId);
      await fetchUser();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject document');
    } finally {
      setVerifying(null);
    }
  };

  const handleRemoveUserVerification = async (documentId: string) => {
    if (!confirm('Are you sure you want to remove verification from this user document?')) return;
    try {
      setVerifying(documentId);
      await adminService.rejectUserDocument(documentId);
      await fetchUser();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove verification');
    } finally {
      setVerifying(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this user account? This will permanently delete the user and ALL associated data including:\n\n- All policies\n- All nominees\n- All documents\n- All subscriptions\n- All activity logs\n\nThis action CANNOT be undone. Type OK to confirm.')) return;
    
    const confirmation = prompt('Type "DELETE" to confirm user account deletion:');
    if (confirmation !== 'DELETE') {
      alert('Deletion cancelled. You must type "DELETE" to confirm.');
      return;
    }

    try {
      await adminService.deleteUser(id);
      alert('User account deleted successfully');
      navigate('/users');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete user account');
    }
  };

  const handleDeleteAllActivityLogs = async () => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete ALL activity logs for this user? This action cannot be undone and will permanently remove all activity history.')) return;
    
    const confirmation = prompt('Type "DELETE ALL" to confirm deletion of all activity logs:');
    if (confirmation !== 'DELETE ALL') {
      alert('Deletion cancelled. You must type "DELETE ALL" to confirm.');
      return;
    }

    try {
      setDeletingAllLogs(true);
      await adminService.deleteAllActivityLogs(id);
      await fetchActivityLogs();
      alert('All activity logs deleted successfully');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete all activity logs');
    } finally {
      setDeletingAllLogs(false);
    }
  };

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <button
          onClick={() => navigate('/users')}
          className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-white/90 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 backdrop-blur-sm border border-gray-300 dark:border-white/20 hover:border-gray-400 dark:hover:border-white/30 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-white/10 hover:-translate-y-0.5 group mt-4 sm:mt-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
          Back to Users
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-200 dark:border-brand-900 border-t-cyan-500 dark:border-t-cyan-400"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-brand opacity-20 blur-xl animate-pulse-glow"></div>
            </div>
            <p className="text-white/80 font-medium animate-pulse">Loading user details...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl shadow-lg">
            {error}
          </div>
        ) : user ? (
          <div className="space-y-6 sm:space-y-8">
            {/* User Profile Card */}
            <section className="bg-white dark:bg-navy-800 rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 dark:border-navy-700 p-4 sm:p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-brand opacity-5 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture.startsWith('http') ? user.profilePicture : `${api.defaults.baseURL || window.location.origin}${user.profilePicture.startsWith('/') ? user.profilePicture : `/${user.profilePicture}`}`}
                      alt={user.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-brand-200 dark:border-brand-700 shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center text-white font-bold text-2xl sm:text-3xl shadow-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gradient-brand mb-1 sm:mb-2 truncate">{user.name}</h1>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 break-all">User ID: {user.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={handleDeleteUser}
                    className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg sm:rounded-xl font-semibold hover:shadow-lg hover:shadow-red-500/50 transition-all text-xs sm:text-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">Delete User Account</span>
                    <span className="sm:hidden">Delete</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">User Information</h3>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="p-3 sm:p-4 bg-gray-50 dark:bg-navy-900/50 rounded-lg sm:rounded-xl border border-gray-100 dark:border-navy-700">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Name</p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white break-words">{user.name || '-'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl border border-gray-100 dark:border-navy-700">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">User ID</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white break-all">{user.id || '-'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl border border-gray-100 dark:border-navy-700">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Email</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white break-all">{user.email || '-'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl border border-gray-100 dark:border-navy-700">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Mobile Number</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.mobileNumber || '-'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl border border-gray-100 dark:border-navy-700">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Date of Birth</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.dob ? formatDate(user.dob) : '-'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl border border-gray-100 dark:border-navy-700">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Subscription Status</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatEnumLabel(user.subscriptionStatus)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl border border-gray-100 dark:border-navy-700">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Firebase UID</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white break-all">{user.firebaseUid || '-'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl border border-gray-100 dark:border-navy-700">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Device ID</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white break-all">{user.deviceId || '-'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl border border-gray-100 dark:border-navy-700">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Referral Code</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.referralCode || '-'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl border border-gray-100 dark:border-navy-700">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Wallet Balance</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.walletBalance !== undefined ? formatCurrency(user.walletBalance) : '-'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl border border-gray-100 dark:border-navy-700">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Created At</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(user.createdAt)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl border border-gray-100 dark:border-navy-700">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Last Updated</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(user.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Usage Summary */}
            <section className="bg-white dark:bg-navy-800 rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 dark:border-navy-700 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center">
                <div className="w-1 h-5 sm:h-6 bg-gradient-brand rounded-full mr-2 sm:mr-3"></div>
                Usage Summary
              </h2>
              <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  { label: 'Policies', value: user.stats.policiesCount, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                  { label: 'Nominees', value: user.stats.nomineesCount, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                  { label: 'Documents', value: user.stats.documentsCount, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
                  { label: 'Subscriptions', value: user.stats.subscriptionsCount, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                  { label: 'Alerts', value: user.stats.alertsCount, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
                ].map((stat, idx) => (
                  <div key={idx} className={`rounded-lg sm:rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-navy-600 p-3 sm:p-4 transition-all ${stat.bg}`}>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{stat.label}</p>
                    <p className={`mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Nominees */}
            <section className="bg-white dark:bg-navy-800 rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 dark:border-navy-700 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center">
                <div className="w-1 h-5 sm:h-6 bg-gradient-brand rounded-full mr-2 sm:mr-3"></div>
                Nominees ({user.nominees.length})
              </h2>
              {user.nominees.length > 0 ? (
                <div className="space-y-6">
                  {user.nominees.map((nominee) => (
                    <div key={nominee.id} className="rounded-xl border border-gray-200 dark:border-navy-700 p-5 bg-gray-50/50 dark:bg-navy-900/30">
                      <div className="mb-4">
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{nominee.name}</h3>
                          {(() => {
                            const statusClass = nominee.status === 'ACCEPTED'
                              ? 'status-active'
                              : nominee.status === 'PENDING'
                              ? 'status-pending'
                              : nominee.status === 'REJECTED'
                              ? 'status-rejected'
                              : nominee.status === 'DRAFT'
                              ? 'status-inactive'
                              : 'status-inactive';
                            return (
                              <span className={statusClass}>
                                {nominee.status}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-3 sm:mb-4">
                          <div className="p-2.5 sm:p-3 bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-600">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Nominee ID</p>
                            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white break-all">{nominee.id}</p>
                          </div>
                          <div className="p-3 bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-600">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Name</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{nominee.name}</p>
                          </div>
                          <div className="p-3 bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-600">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Gender</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{nominee.gender ? formatEnumLabel(nominee.gender) : '-'}</p>
                          </div>
                          <div className="p-3 bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-600">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Relationship</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatEnumLabel(nominee.relationship)}</p>
                          </div>
                          <div className="p-3 bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-600">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Mobile Number</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{nominee.mobileNumber || '-'}</p>
                          </div>
                          <div className="p-3 bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-600">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Email</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white break-all">{nominee.email || '-'}</p>
                          </div>
                          <div className="p-3 bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-600">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Date of Birth</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{nominee.dob ? formatDate(nominee.dob) : '-'}</p>
                          </div>
                          <div className="p-3 bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-600 sm:col-span-2 lg:col-span-3">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Address</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{nominee.address || '-'}</p>
                          </div>
                          <div className="p-3 bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-600">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Status</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatEnumLabel(nominee.status)}</p>
                          </div>
                          <div className="p-3 bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-600">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Created At</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(nominee.createdAt)}</p>
                          </div>
                          <div className="p-3 bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-600">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Last Updated</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(nominee.updatedAt)}</p>
                          </div>
                        </div>
                        {nominee.policies.length > 0 && (
                          <div className="mt-4 rounded-xl border border-gray-200 dark:border-navy-600 bg-white dark:bg-navy-800 p-4">
                            <p className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-3">Linked Policies</p>
                            <div className="space-y-3">
                              {nominee.policies.map((policy) => (
                                <div key={policy.id} className="p-3 rounded-lg bg-gray-50 dark:bg-navy-900/50 border border-gray-100 dark:border-navy-700">
                                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                    <div>
                                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Policy Number</p>
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{policy.policyNumber}</p>
                                    </div>
                                    {policy.sumAssured && (
                                      <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Sum Assured</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(policy.sumAssured)}</p>
                                      </div>
                                    )}
                                    {policy.status && (
                                      <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Policy Status</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatEnumLabel(policy.status)}</p>
                                      </div>
                                    )}
                                    {policy.sharePercentage && (
                                      <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Share Percentage</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{policy.sharePercentage}%</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 rounded-xl border border-gray-200 dark:border-navy-600 bg-white dark:bg-navy-800 p-4">
                        <p className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-3">Documents</p>
                        {nominee.documents.length > 0 ? (
                          <div className="space-y-3">
                            {nominee.documents.map((document) => (
                              <div key={document.id} className="flex flex-col gap-3 rounded-lg bg-gray-50 dark:bg-navy-900/50 p-3 border border-gray-100 dark:border-navy-700 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white break-words">{document.documentName}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {formatEnumLabel(document.documentType)} • Uploaded {formatDate(document.uploadedAt)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                  {getDocumentStatusBadge(document.isVerified, document.rejectedAt)}
                                  <a href={document.documentUrl} target="_blank" rel="noopener noreferrer" className="btn-xs btn-outline-primary">
                                    <ExternalLink className="w-3 h-3 mr-1" /> View
                                  </a>
                                  {!document.isVerified ? (
                                    <>
                                      <button onClick={() => handleVerifyNomineeDocument(document.id)} disabled={verifying === document.id} className="btn-xs btn-success">
                                        <CheckCircle className="w-3 h-3 mr-1" /> Accept
                                      </button>
                                      <button onClick={() => handleRejectNomineeDocument(document.id)} disabled={verifying === document.id} className="btn-xs btn-danger">
                                        <XCircle className="w-3 h-3 mr-1" /> Reject
                                      </button>
                                    </>
                                  ) : (
                                    <button onClick={() => handleRemoveNomineeVerification(document.id)} disabled={verifying === document.id} className="btn-xs btn-warning">
                                      <RotateCcw className="w-3 h-3 mr-1" /> Remove
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-navy-900/30 rounded-lg">
                            <div className="text-sm text-gray-500 dark:text-gray-400">No documents uploaded</div>
                            <div className="flex items-center gap-2">
                              <button onClick={async () => {
                                try {
                                  setVerifying(nominee.id);
                                  await adminService.acceptNomineeWithoutDocuments(nominee.id);
                                  await fetchUser();
                                } catch (err: any) {
                                  alert(err.response?.data?.error || 'Failed to accept nominee');
                                } finally {
                                  setVerifying(null);
                                }
                              }} disabled={verifying === nominee.id} className="btn-xs btn-success">
                                <CheckCircle className="w-3 h-3 mr-1" /> Accept
                              </button>
                              <button onClick={async () => {
                                if (!confirm('Are you sure you want to reject this nominee without documents?')) return;
                                try {
                                  setVerifying(nominee.id);
                                  await adminService.rejectNomineeWithoutDocuments(nominee.id);
                                  await fetchUser();
                                } catch (err: any) {
                                  alert(err.response?.data?.error || 'Failed to reject nominee');
                                } finally {
                                  setVerifying(null);
                                }
                              }} disabled={verifying === nominee.id} className="btn-xs btn-danger">
                                <XCircle className="w-3 h-3 mr-1" /> Reject
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No nominees added for this user.</p>
              )}
            </section>

            {/* Policies */}
            <section className="bg-white dark:bg-navy-800 rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 dark:border-navy-700 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center">
                <div className="w-1 h-5 sm:h-6 bg-gradient-brand rounded-full mr-2 sm:mr-3"></div>
                Policies ({user.recentPolicies.length})
              </h2>
              {user.recentPolicies.length > 0 ? (
                <div className="space-y-6">
                  {user.recentPolicies.map((policy) => (
                    <div key={policy.id} className="rounded-xl border border-gray-200 dark:border-navy-700 p-5 bg-gray-50/50 dark:bg-navy-900/30">
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{policy.policyNumber}</h3>
                        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-3 sm:mb-4">
                          <div className="p-3 bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-600">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Policy ID</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white break-all">{policy.id}</p>
                          </div>
                          <div className="p-3 bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-600">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Policy Number</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{policy.policyNumber}</p>
                          </div>
                          <div className="p-3 bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-600">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Sum Assured</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(policy.sumAssured)}</p>
                          </div>
                          <div className="p-3 bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-600">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Status</p>
                            <span
                              className={`${
                                policy.status === 'ACCEPTED'
                                  ? 'status-active'
                                  : policy.status === 'PENDING'
                                  ? 'status-pending'
                                  : policy.status === 'REJECTED'
                                  ? 'status-rejected'
                                  : policy.status === 'DRAFT'
                                  ? 'status-inactive'
                                  : 'status-inactive'
                              } text-sm font-bold inline-block`}
                            >
                              {formatEnumLabel(policy.status)}
                            </span>
                          </div>
                          {policy.uploadedAt && (
                            <div className="p-3 bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-600">
                              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Uploaded At</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(policy.uploadedAt)}</p>
                            </div>
                          )}
                          {policy.insuranceCompany && (
                            <>
                              <div className="p-3 bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-600">
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Insurance Company</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{policy.insuranceCompany.name}</p>
                              </div>
                              {policy.insuranceCompany.contactEmail && (
                                <div className="p-3 bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-600">
                                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Company Email</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white break-all">{policy.insuranceCompany.contactEmail}</p>
                                </div>
                              )}
                              {policy.insuranceCompany.contactNumber && (
                                <div className="p-3 bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-600">
                                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Company Contact</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{policy.insuranceCompany.contactNumber}</p>
                                </div>
                              )}
                              {policy.insuranceCompany.websiteUrl && (
                                <div className="p-3 bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-600">
                                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Website</p>
                                  <a href={policy.insuranceCompany.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline break-all">
                                    {policy.insuranceCompany.websiteUrl}
                                  </a>
                                </div>
                              )}
                              {policy.insuranceCompany.address && (
                                <div className="p-3 bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-600 sm:col-span-2 lg:col-span-3">
                                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Company Address</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{policy.insuranceCompany.address}</p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        {policy.nominees && policy.nominees.length > 0 && (
                          <div className="mt-4 rounded-xl border border-gray-200 dark:border-navy-600 bg-white dark:bg-navy-800 p-4">
                            <p className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-3">Linked Nominees</p>
                            <div className="space-y-3">
                              {policy.nominees.map((nominee) => (
                                <div key={nominee.id} className="p-3 rounded-lg bg-gray-50 dark:bg-navy-900/50 border border-gray-100 dark:border-navy-700">
                                  <div className="grid gap-2 sm:grid-cols-3">
                                    <div>
                                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Nominee Name</p>
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{nominee.name}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Relationship</p>
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatEnumLabel(nominee.relationship)}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Share Percentage</p>
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{nominee.sharePercentage}%</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {policy.documents && policy.documents.length > 0 && (
                        <div className="mt-4 rounded-xl border border-gray-200 dark:border-navy-600 bg-white dark:bg-navy-800 p-4">
                          <p className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-3">Policy Documents</p>
                          <div className="space-y-3">
                            {policy.documents.map((document) => (
                              <div key={document.id} className="flex flex-col gap-3 rounded-lg bg-gray-50 dark:bg-navy-900/50 p-3 border border-gray-100 dark:border-navy-700 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{document.documentName}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {formatEnumLabel(document.documentType)} • Uploaded {formatDate(document.uploadedAt)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                  {getDocumentStatusBadge(document.isVerified, document.rejectedAt)}
                                  <a href={document.documentUrl} target="_blank" rel="noopener noreferrer" className="btn-xs btn-outline-primary">
                                    <ExternalLink className="w-3 h-3 mr-1" /> View
                                  </a>
                                  {!document.isVerified ? (
                                    <>
                                      <button onClick={() => handleVerifyPolicyDocument(document.id)} disabled={verifying === document.id} className="btn-xs btn-success">
                                        <CheckCircle className="w-3 h-3 mr-1" /> Accept
                                      </button>
                                      <button onClick={() => handleRejectPolicyDocument(document.id)} disabled={verifying === document.id} className="btn-xs btn-danger">
                                        <XCircle className="w-3 h-3 mr-1" /> Reject
                                      </button>
                                    </>
                                  ) : (
                                    <button onClick={() => handleRemovePolicyVerification(document.id)} disabled={verifying === document.id} className="btn-xs btn-warning">
                                      <RotateCcw className="w-3 h-3 mr-1" /> Remove
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No policies found for this user.</p>
              )}
            </section>

            {/* Recent Subscriptions */}
            <section className="bg-white dark:bg-navy-800 rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 dark:border-navy-700 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center">
                <div className="w-1 h-5 sm:h-6 bg-gradient-brand rounded-full mr-2 sm:mr-3"></div>
                Recent Subscriptions
              </h2>
              {user.recentSubscriptions.length > 0 ? (
                <div className="space-y-4">
                  {user.recentSubscriptions.map((subscription) => (
                    <div key={subscription.id} className="rounded-xl border border-gray-200 dark:border-navy-700 p-4 bg-gray-50/50 dark:bg-navy-900/30">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{subscription.planName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Transaction: {formatDate(subscription.transactionDate)}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(subscription.amount)}</div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                            Status: <span className="text-gray-900 dark:text-white">{formatEnumLabel(subscription.paymentStatus)}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No subscription history available.</p>
              )}
            </section>

            {/* User Documents */}
            <section className="bg-white dark:bg-navy-800 rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 dark:border-navy-700 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center">
                <div className="w-1 h-5 sm:h-6 bg-gradient-brand rounded-full mr-2 sm:mr-3"></div>
                User Documents ({user.documents.length})
              </h2>
              {user.documents.length > 0 ? (
                <div className="space-y-4">
                  {user.documents.map((document) => (
                    <div key={document.id} className="flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-gray-50/50 dark:bg-navy-900/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 dark:text-white break-words">{document.documentName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatEnumLabel(document.documentType)} • Uploaded {formatDate(document.uploadedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        {getDocumentStatusBadge(document.isVerified)}
                        <a href={document.documentUrl} target="_blank" rel="noopener noreferrer" className="btn-xs btn-outline-primary">
                          <ExternalLink className="w-3 h-3 mr-1" /> View
                        </a>
                        {!document.isVerified ? (
                          <>
                            <button onClick={() => handleVerifyUserDocument(document.id)} disabled={verifying === document.id} className="btn-xs btn-success">
                              <CheckCircle className="w-3 h-3 mr-1" /> Accept
                            </button>
                            <button onClick={() => handleRejectUserDocument(document.id)} disabled={verifying === document.id} className="btn-xs btn-danger">
                              <XCircle className="w-3 h-3 mr-1" /> Reject
                            </button>
                          </>
                        ) : (
                          <button onClick={() => handleRemoveUserVerification(document.id)} disabled={verifying === document.id} className="btn-xs btn-warning">
                            <RotateCcw className="w-3 h-3 mr-1" /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No documents uploaded by this user.</p>
              )}
            </section>

            {/* Activity Log */}
            <section className="bg-white dark:bg-navy-800 rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 dark:border-navy-700 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <div className="w-1 h-6 bg-gradient-brand rounded-full mr-3"></div>
                    Activity Log
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-4">Track all user activities and changes</p>
                </div>
                <div className="flex items-center gap-3">
                  {activityLogs && activityLogs.pagination.total > 0 && (
                    <div className="px-3 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full text-xs font-bold border border-brand-100 dark:border-brand-800">
                      {activityLogs.pagination.total} Activities
                    </div>
                  )}
                  {activityLogs && activityLogs.pagination.total > 0 && (
                    <button
                      onClick={handleDeleteAllActivityLogs}
                      disabled={deletingAllLogs}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete all activity logs"
                    >
                      {deletingAllLogs ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3 h-3 mr-1.5" />
                          Delete All
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {activityLogsLoading ? (
                <div className="flex min-h-[20vh] items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600 dark:border-brand-400"></div>
                </div>
              ) : activityLogs && activityLogs.data.length > 0 ? (
                <div className="space-y-4">
                  {activityLogs.data.map((log) => {
                    const ActivityIcon = getActivityIcon(log.activityType);
                    const colors = getActivityColor(log.activityType);
                    return (
                      <div key={log.id} className={`flex items-start gap-4 rounded-xl border p-5 transition-all hover:shadow-md ${colors.bg} ${colors.border}`}>
                        <div className="flex-shrink-0 mt-0.5">
                          <div className={`p-2.5 rounded-lg shadow-sm ${colors.iconBg} ${colors.text}`}>
                            <ActivityIcon className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className={`text-sm font-bold ${colors.text}`}>{formatEnumLabel(log.activityType)}</p>
                              </div>
                              {log.description && (
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 leading-relaxed">
                                  {log.description}
                                </p>
                              )}
                              {log.metadata && Object.keys(log.metadata).length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {Object.entries(log.metadata).map(([key, value]) => (
                                      <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-1">
                                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide min-w-[100px]">
                                          {formatEnumLabel(key)}:
                                        </span>
                                        <span className="text-xs font-semibold text-gray-900 dark:text-white break-words">
                                          {String(value)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Time</div>
                              <div className="text-xs font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                {formatDate(log.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Pagination */}
                  {activityLogs.pagination.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-navy-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Showing <span className="font-bold text-gray-900 dark:text-white">{((activityLogsPage - 1) * 50) + 1}</span> to{' '}
                        <span className="font-bold text-gray-900 dark:text-white">{Math.min(activityLogsPage * 50, activityLogs.pagination.total)}</span> of{' '}
                        <span className="font-bold text-gray-900 dark:text-white">{activityLogs.pagination.total}</span>
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setActivityLogsPage((p) => Math.max(1, p - 1))}
                          disabled={activityLogsPage === 1}
                          className="px-4 py-2 text-xs font-bold border border-gray-300 dark:border-navy-600 rounded-lg hover:bg-gray-50 dark:hover:bg-navy-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setActivityLogsPage((p) => p + 1)}
                          disabled={activityLogsPage >= activityLogs.pagination.totalPages}
                          className="px-4 py-2 text-xs font-bold border border-gray-300 dark:border-navy-600 rounded-lg hover:bg-gray-50 dark:hover:bg-navy-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-300 dark:text-navy-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No activity logs available for this user.</p>
                </div>
              )}
            </section>
          </div>
        ) : (
          <p className="text-sm text-white/80">No user data available.</p>
        )}
      </div>
    </div>
  );
}

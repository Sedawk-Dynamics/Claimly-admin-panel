import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, ExternalLink, Clock, FileText, CreditCard, UserPlus, UserCog, Shield, Upload, Edit } from 'lucide-react';
import { adminService } from '../services/admin.service';
import { UserDetail as AdminUserDetail, UserActivityLog, PaginatedResponse } from '../types';

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

const getDocumentStatusBadge = (isVerified: boolean) => {
  if (isVerified) {
    return <span className="badge badge-success"><CheckCircle className="w-3 h-3 mr-1" /> Verified</span>;
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

  return (
    <div className="min-h-screen bg-gradient-brand dark:bg-gradient-navy p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/users')}
          className="inline-flex items-center text-sm font-medium text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
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
            <section className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl border border-gray-100 dark:border-navy-700 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-brand opacity-5 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <h1 className="text-3xl font-bold text-gradient-brand mb-2">{user.name}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 break-all mb-6">User ID: {user.id}</p>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl border border-gray-100 dark:border-navy-700">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Email</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white break-all">{user.email || '-'}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl border border-gray-100 dark:border-navy-700">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Mobile</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.mobileNumber || '-'}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl border border-gray-100 dark:border-navy-700">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Subscription</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatEnumLabel(user.subscriptionStatus)}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl border border-gray-100 dark:border-navy-700">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">DOB</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.dob ? formatDate(user.dob) : '-'}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl border border-gray-100 dark:border-navy-700">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Created</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(user.createdAt)}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-navy-900/50 rounded-xl border border-gray-100 dark:border-navy-700">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Last Updated</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(user.updatedAt)}</p>
                </div>
              </div>
            </section>

            {/* Usage Summary */}
            <section className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl border border-gray-100 dark:border-navy-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <div className="w-1 h-6 bg-gradient-brand rounded-full mr-3"></div>
                Usage Summary
              </h2>
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  { label: 'Policies', value: user.stats.policiesCount, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                  { label: 'Nominees', value: user.stats.nomineesCount, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                  { label: 'Documents', value: user.stats.documentsCount, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
                  { label: 'Subscriptions', value: user.stats.subscriptionsCount, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                  { label: 'Alerts', value: user.stats.alertsCount, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
                ].map((stat, idx) => (
                  <div key={idx} className={`rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-navy-600 p-4 transition-all ${stat.bg}`}>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{stat.label}</p>
                    <p className={`mt-2 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Nominees */}
            <section className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl border border-gray-100 dark:border-navy-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <div className="w-1 h-6 bg-gradient-brand rounded-full mr-3"></div>
                Nominees ({user.nominees.length})
              </h2>
              {user.nominees.length > 0 ? (
                <div className="space-y-6">
                  {user.nominees.map((nominee) => (
                    <div key={nominee.id} className="rounded-xl border border-gray-200 dark:border-navy-700 p-5 bg-gray-50/50 dark:bg-navy-900/30">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-4">
                        <div className="space-y-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{nominee.name}</h3>
                          <div className="flex flex-wrap gap-3 text-sm">
                            <span className="px-2 py-1 rounded-md bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-600 text-gray-600 dark:text-gray-300">
                              {formatEnumLabel(nominee.relationship)}
                            </span>
                            <span className="px-2 py-1 rounded-md bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-600 text-gray-600 dark:text-gray-300">
                              {nominee.mobileNumber || '-'}
                            </span>
                            <span className="px-2 py-1 rounded-md bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-600 text-gray-600 dark:text-gray-300">
                              {nominee.email || '-'}
                            </span>
                          </div>
                        </div>
                        {nominee.policies.length > 0 && (
                          <div className="md:text-right">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Linked Policies</p>
                            <div className="flex flex-wrap gap-2 justify-end">
                              {nominee.policies.map((policy) => (
                                <span key={policy.id} className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium">
                                  {policy.policyNumber}
                                </span>
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
                                  {getDocumentStatusBadge(document.isVerified)}
                                  <a href={document.documentUrl} target="_blank" rel="noopener noreferrer" className="btn-xs btn-outline-primary">
                                    <ExternalLink className="w-3 h-3 mr-1" /> View
                                  </a>
                                  {!document.isVerified ? (
                                    <>
                                      <button onClick={() => handleVerifyNomineeDocument(document.id)} disabled={verifying === document.id} className="btn-xs btn-success">
                                        <CheckCircle className="w-3 h-3 mr-1" /> Verify
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
            <section className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl border border-gray-100 dark:border-navy-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <div className="w-1 h-6 bg-gradient-brand rounded-full mr-3"></div>
                Policies
              </h2>
              {user.recentPolicies.length > 0 ? (
                <div className="space-y-6">
                  {user.recentPolicies.map((policy) => (
                    <div key={policy.id} className="rounded-xl border border-gray-200 dark:border-navy-700 p-5 bg-gray-50/50 dark:bg-navy-900/30">
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Policy Number</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{policy.policyNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Sum Assured</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(policy.sumAssured)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Status</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{formatEnumLabel(policy.status)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Insurer</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{policy.insuranceCompany?.name || '-'}</p>
                        </div>
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
                                  {getDocumentStatusBadge(document.isVerified)}
                                  <a href={document.documentUrl} target="_blank" rel="noopener noreferrer" className="btn-xs btn-outline-primary">
                                    <ExternalLink className="w-3 h-3 mr-1" /> View
                                  </a>
                                  {!document.isVerified ? (
                                    <>
                                      <button onClick={() => handleVerifyPolicyDocument(document.id)} disabled={verifying === document.id} className="btn-xs btn-success">
                                        <CheckCircle className="w-3 h-3 mr-1" /> Verify
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
            <section className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl border border-gray-100 dark:border-navy-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <div className="w-1 h-6 bg-gradient-brand rounded-full mr-3"></div>
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
            <section className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl border border-gray-100 dark:border-navy-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <div className="w-1 h-6 bg-gradient-brand rounded-full mr-3"></div>
                User Documents
              </h2>
              {user.documents.length > 0 ? (
                <div className="space-y-4">
                  {user.documents.map((document) => (
                    <div key={document.id} className="flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-gray-50/50 dark:bg-navy-900/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{document.documentName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatEnumLabel(document.documentType)} • Uploaded {formatDate(document.uploadedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`badge ${document.isVerified ? 'badge-success' : 'badge-warning'}`}>
                          {document.isVerified ? 'Verified' : 'Pending'}
                        </span>
                        <a href={document.documentUrl} target="_blank" rel="noopener noreferrer" className="btn-xs btn-outline-primary">
                          View
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No documents uploaded by this user.</p>
              )}
            </section>

            {/* Activity Log */}
            <section className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl border border-gray-100 dark:border-navy-700 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <div className="w-1 h-6 bg-gradient-brand rounded-full mr-3"></div>
                    Activity Log
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-4">Track all user activities and changes</p>
                </div>
                {activityLogs && activityLogs.pagination.total > 0 && (
                  <div className="px-3 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full text-xs font-bold border border-brand-100 dark:border-brand-800">
                    {activityLogs.pagination.total} Activities
                  </div>
                )}
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

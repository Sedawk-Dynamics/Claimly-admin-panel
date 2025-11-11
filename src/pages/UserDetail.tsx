import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, ExternalLink, Clock, FileText, CreditCard, UserPlus, UserCog, Shield, Upload, Edit } from 'lucide-react';
import { adminService } from '../services/admin.service';
import { UserDetail as AdminUserDetail, UserActivityLog, PaginatedResponse } from '../types';

const formatDate = (value?: string | Date | null) => {
  if (!value) {
    return '-';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === 'string' ? value : '-';
  }
  return date.toLocaleString();
};

const formatEnumLabel = (value?: string | null) => {
  if (!value) {
    return '-';
  }
  return value
    .toString()
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatCurrency = (value?: string | number | null) => {
  if (value === null || value === undefined) {
    return '-';
  }
  const amount = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(amount)) {
    return value?.toString() || '-';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

const getDocumentStatusBadge = (isVerified: boolean, verifiedAt?: string | null) => {
  const isReverification = !isVerified && verifiedAt;
  if (isVerified) {
    return (
      <span className="text-xs font-semibold uppercase text-green-600">Verified</span>
    );
  } else if (isReverification) {
    return (
      <span className="inline-flex items-center text-xs font-semibold uppercase text-orange-600">
        <RotateCcw className="w-3 h-3 mr-1" />
        Re-verification
      </span>
    );
  } else {
    return (
      <span className="text-xs font-semibold uppercase text-amber-600">Pending</span>
    );
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
    DOCUMENT_UPLOADED: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', iconBg: 'bg-blue-200' },
    DOCUMENT_UPDATED: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', iconBg: 'bg-purple-200' },
    SUBSCRIPTION_CREATED: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', iconBg: 'bg-green-200' },
    SUBSCRIPTION_EXPIRED: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', iconBg: 'bg-red-200' },
    NOMINEE_ADDED: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', iconBg: 'bg-indigo-200' },
    NOMINEE_UPDATED: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200', iconBg: 'bg-cyan-200' },
    POLICY_ADDED: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', iconBg: 'bg-emerald-200' },
    POLICY_DOCUMENT_UPLOADED: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', iconBg: 'bg-amber-200' },
    NOMINEE_DOCUMENT_UPLOADED: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200', iconBg: 'bg-pink-200' },
  };
  return colorMap[activityType] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', iconBg: 'bg-gray-200' };
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
    if (id) {
      fetchActivityLogs();
    }
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
    if (!confirm('Are you sure you want to reject this policy document?')) {
      return;
    }
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
    if (!confirm('Are you sure you want to reject this nominee document?')) {
      return;
    }
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
    if (!confirm('Are you sure you want to remove verification from this nominee document?')) {
      return;
    }
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
    if (!confirm('Are you sure you want to remove verification from this policy document?')) {
      return;
    }
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
    <div className="space-y-8">
      <button
        onClick={() => navigate('/users')}
        className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Users
      </button>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : user ? (
        <div className="space-y-10">
          <section className="rounded-lg bg-white p-6 shadow">
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="mt-1 text-sm text-gray-500">User ID: {user.id}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Email</p>
                <p className="mt-1 break-all text-sm text-gray-900">{user.email || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Mobile</p>
                <p className="mt-1 text-sm text-gray-900">{user.mobileNumber || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Subscription Status</p>
                <p className="mt-1 text-sm text-gray-900">{formatEnumLabel(user.subscriptionStatus)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Date of Birth</p>
                <p className="mt-1 text-sm text-gray-900">{user.dob ? formatDate(user.dob) : '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Firebase UID</p>
                <p className="mt-1 break-all text-sm text-gray-900">{user.firebaseUid || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Device ID</p>
                <p className="mt-1 break-all text-sm text-gray-900">{user.deviceId || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Created</p>
                <p className="mt-1 text-sm text-gray-900">{formatDate(user.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Last Updated</p>
                <p className="mt-1 text-sm text-gray-900">{formatDate(user.updatedAt)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-semibold text-gray-900">Usage Summary</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Policies</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{user.stats.policiesCount}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Nominees</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{user.stats.nomineesCount}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Documents</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{user.stats.documentsCount}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Subscriptions</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{user.stats.subscriptionsCount}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Alerts</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{user.stats.alertsCount}</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Nominees ({user.nominees.length})</h2>
            </div>
            {user.nominees.length > 0 ? (
              <div className="mt-6 space-y-5">
                {user.nominees.map((nominee) => (
                  <div key={nominee.id} className="rounded-lg border border-gray-200 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-900">{nominee.name}</h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Relationship</p>
                            <p className="mt-1 text-sm text-gray-900">{formatEnumLabel(nominee.relationship)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Mobile</p>
                            <p className="mt-1 text-sm text-gray-900">{nominee.mobileNumber || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Email</p>
                            <p className="mt-1 break-all text-sm text-gray-900">{nominee.email || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Address</p>
                            <p className="mt-1 text-sm text-gray-900">{nominee.address || '-'}</p>
                          </div>
                        </div>
                      </div>
                      {nominee.policies.length > 0 && (
                        <div className="md:text-right">
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Linked Policies</p>
                          <ul className="mt-2 space-y-1 text-sm text-gray-700">
                            {nominee.policies.map((policy) => (
                              <li key={policy.id}>{policy.policyNumber}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {nominee.documents.length > 0 && (
                      <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <p className="text-sm font-medium text-gray-700">Documents</p>
                        <div className="mt-2 space-y-2">
                          {nominee.documents.map((document) => (
                            <div
                              key={document.id}
                              className="flex flex-col gap-2 rounded-md bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900">{document.documentName}</p>
                                <p className="text-xs text-gray-500">
                                  {formatEnumLabel(document.documentType)} • Uploaded {formatDate(document.uploadedAt)}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 flex-wrap">
                                {getDocumentStatusBadge(document.isVerified, document.verifiedAt)}
                                <a
                                  href={document.documentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                                >
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  View
                                </a>
                                {!document.isVerified ? (
                                  <>
                                    <button
                                      onClick={() => handleVerifyNomineeDocument(document.id)}
                                      disabled={verifying === document.id}
                                      className="inline-flex items-center text-sm text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Verify
                                    </button>
                                    <button
                                      onClick={() => handleRejectNomineeDocument(document.id)}
                                      disabled={verifying === document.id}
                                      className="inline-flex items-center text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Reject
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => handleRemoveNomineeVerification(document.id)}
                                    disabled={verifying === document.id}
                                    className="inline-flex items-center text-sm text-orange-600 hover:text-orange-700 font-medium disabled:opacity-50"
                                  >
                                    <RotateCcw className="w-4 h-4 mr-1" />
                                    Remove Verification
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
              <p className="mt-4 text-sm text-gray-500">No nominees added for this user.</p>
            )}
          </section>

          <section className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-semibold text-gray-900">Policies</h2>
            {user.recentPolicies.length > 0 ? (
              <div className="mt-6 space-y-5">
                {user.recentPolicies.map((policy) => (
                  <div key={policy.id} className="rounded-lg border border-gray-200 p-4">
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-900">Policy #{policy.policyNumber}</p>
                      <p className="mt-2 text-sm text-gray-700">Sum Assured: {formatCurrency(policy.sumAssured)}</p>
                      <p className="mt-1 text-sm text-gray-700">Status: {formatEnumLabel(policy.status)}</p>
                      <p className="mt-1 text-sm text-gray-700">Insurer: {policy.insuranceCompany?.name || '-'}</p>
                    </div>
                    {policy.documents && policy.documents.length > 0 && (
                      <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Policy Documents</p>
                        <div className="space-y-2">
                          {policy.documents.map((document) => (
                            <div
                              key={document.id}
                              className="flex flex-col gap-2 rounded-md bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900">{document.documentName}</p>
                                <p className="text-xs text-gray-500">
                                  {formatEnumLabel(document.documentType)} • Uploaded {formatDate(document.uploadedAt)}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 flex-wrap">
                                {getDocumentStatusBadge(document.isVerified, document.verifiedAt)}
                                <a
                                  href={document.documentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                                >
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  View
                                </a>
                                {!document.isVerified ? (
                                  <>
                                    <button
                                      onClick={() => handleVerifyPolicyDocument(document.id)}
                                      disabled={verifying === document.id}
                                      className="inline-flex items-center text-sm text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Verify
                                    </button>
                                    <button
                                      onClick={() => handleRejectPolicyDocument(document.id)}
                                      disabled={verifying === document.id}
                                      className="inline-flex items-center text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Reject
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => handleRemovePolicyVerification(document.id)}
                                    disabled={verifying === document.id}
                                    className="inline-flex items-center text-sm text-orange-600 hover:text-orange-700 font-medium disabled:opacity-50"
                                  >
                                    <RotateCcw className="w-4 h-4 mr-1" />
                                    Remove Verification
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
              <p className="mt-4 text-sm text-gray-500">No policies found for this user.</p>
            )}
          </section>

          <section className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-semibold text-gray-900">Recent Subscriptions</h2>
            {user.recentSubscriptions.length > 0 ? (
              <div className="mt-6 space-y-3">
                {user.recentSubscriptions.map((subscription) => (
                  <div key={subscription.id} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{subscription.planName}</p>
                        <p className="text-xs text-gray-500">Transaction: {formatDate(subscription.transactionDate)}</p>
                      </div>
                      <div className="text-sm text-gray-700">Amount: {formatCurrency(subscription.amount)}</div>
                    </div>
                    <p className="mt-2 text-sm text-gray-700">
                      Status: {formatEnumLabel(subscription.paymentStatus)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-500">No subscription history available.</p>
            )}
          </section>

          <section className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-semibold text-gray-900">Recent Alerts</h2>
            {user.recentAlerts.length > 0 ? (
              <div className="mt-6 space-y-3">
                {user.recentAlerts.map((alert) => (
                  <div key={alert.id} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Detected via {formatEnumLabel(alert.detectedVia)}
                        </p>
                        <p className="text-xs text-gray-500">Detection Date: {formatDate(alert.detectionDate)}</p>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        Status: {formatEnumLabel(alert.verificationStatus)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Created: {formatDate(alert.createdAt)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-500">No alerts recorded for this user.</p>
            )}
          </section>

          <section className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-xl font-semibold text-gray-900">User Documents</h2>
            {user.documents.length > 0 ? (
              <div className="mt-6 space-y-3">
                {user.documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{document.documentName}</p>
                      <p className="text-xs text-gray-500">
                        {formatEnumLabel(document.documentType)} • Uploaded {formatDate(document.uploadedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-semibold uppercase ${
                          document.isVerified ? 'text-green-600' : 'text-amber-600'
                        }`}
                      >
                        {document.isVerified ? 'Verified' : 'Pending'}
                      </span>
                      <a
                        href={document.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-500">No documents uploaded by this user.</p>
            )}
          </section>

          <section className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Activity Log</h2>
                <p className="text-sm text-gray-500 mt-1">Track all user activities and changes</p>
              </div>
              {activityLogs && activityLogs.pagination.total > 0 && (
                <div className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                  {activityLogs.pagination.total} {activityLogs.pagination.total === 1 ? 'Activity' : 'Activities'}
                </div>
              )}
            </div>
            {activityLogsLoading ? (
              <div className="flex min-h-[20vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
              </div>
            ) : activityLogs && activityLogs.data.length > 0 ? (
              <div className="space-y-3">
                {activityLogs.data.map((log) => {
                  const ActivityIcon = getActivityIcon(log.activityType);
                  const colors = getActivityColor(log.activityType);
                  return (
                    <div
                      key={log.id}
                      className={`flex items-start gap-4 rounded-lg border-2 p-5 transition-all hover:shadow-lg ${colors.bg} ${colors.border}`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={`p-2.5 rounded-lg ${colors.iconBg} ${colors.text}`}>
                          <ActivityIcon className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className={`text-base font-bold ${colors.text}`}>
                                {formatEnumLabel(log.activityType)}
                              </p>
                            </div>
                            {log.description && (
                              <p className="text-sm font-semibold text-gray-800 mb-2 leading-relaxed">
                                {log.description}
                              </p>
                            )}
                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                              <div className="mt-3 pt-3 border-t-2 border-gray-300 border-opacity-30">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {Object.entries(log.metadata).map(([key, value]) => (
                                    <div key={key} className="flex items-start gap-2">
                                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wide min-w-[120px]">
                                        {formatEnumLabel(key)}:
                                      </span>
                                      <span className="text-xs font-semibold text-gray-900 break-words">
                                        {String(value)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <div className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                              Time
                            </div>
                            <div className="text-sm font-bold text-gray-900 whitespace-nowrap">
                              {formatDate(log.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {activityLogs.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t-2 border-gray-200">
                    <p className="text-sm font-medium text-gray-600">
                      Showing <span className="font-bold text-gray-900">{((activityLogsPage - 1) * 50) + 1}</span> to{' '}
                      <span className="font-bold text-gray-900">
                        {Math.min(activityLogsPage * 50, activityLogs.pagination.total)}
                      </span>{' '}
                      of <span className="font-bold text-gray-900">{activityLogs.pagination.total}</span> activities
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActivityLogsPage((p) => Math.max(1, p - 1))}
                        disabled={activityLogsPage === 1}
                        className="px-4 py-2 text-sm font-medium border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setActivityLogsPage((p) => p + 1)}
                        disabled={activityLogsPage >= activityLogs.pagination.totalPages}
                        className="px-4 py-2 text-sm font-medium border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">No activity logs available for this user.</p>
              </div>
            )}
          </section>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No user data available.</p>
      )}
    </div>
  );
}


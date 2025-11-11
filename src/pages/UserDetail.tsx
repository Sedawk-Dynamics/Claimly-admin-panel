import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, ExternalLink } from 'lucide-react';
import { adminService } from '../services/admin.service';
import { UserDetail as AdminUserDetail } from '../types';

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

export default function UserDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState<string | null>(null);

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
        </div>
      ) : (
        <p className="text-sm text-gray-500">No user data available.</p>
      )}
    </div>
  );
}


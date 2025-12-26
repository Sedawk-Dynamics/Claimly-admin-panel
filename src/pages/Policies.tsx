import { useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';
import { Policy, PaginatedResponse } from '../types';
import { ChevronLeft, ChevronRight, FileText, Search, Shield, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

export default function Policies() {
  const [policies, setPolicies] = useState<PaginatedResponse<Policy> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 25;

  useEffect(() => {
    loadPolicies();
  }, [page, searchQuery]);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getPolicies(page, limit, searchQuery);
      if (data && data.data && Array.isArray(data.data)) {
        setPolicies(data);
      } else {
        setPolicies({ data: [], pagination: { page: 1, limit: 25, total: 0, totalPages: 0 } });
        setError('Invalid response format from server');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load policies');
      setPolicies({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-ocean rounded-xl blur-lg opacity-60 animate-pulse-glow-cyan"></div>
            <div className="relative p-3 bg-gradient-to-br from-brand-500 to-cyan-500 rounded-xl shadow-glow-brand">
              <Shield className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gradient-ocean">Policies</h1>
            {policies && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-500" />
                <span><strong>{policies.pagination.total}</strong> {policies.pagination.total === 1 ? 'policy' : 'policies'} total</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="w-full max-w-2xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-brand-500 dark:text-brand-400 w-5 h-5 z-10" />
          <input
            type="text"
            placeholder="Search policies by number, user, or company..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-12 pr-4 py-3.5 border-2 border-brand-400/30 dark:border-brand-500/30 rounded-xl bg-white dark:bg-navy-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-400 dark:focus:ring-brand-500 focus:border-brand-400 dark:focus:border-brand-500 transition-all duration-300 shadow-md hover:shadow-glow-brand placeholder:text-gray-400"
          />
        </div>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 border-l-4 border-orange-500 text-orange-700 dark:text-orange-400 px-5 py-4 rounded-r-xl shadow-glow-orange">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-200 dark:border-brand-900 border-t-cyan-500 dark:border-t-cyan-400"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-brand opacity-20 blur-xl animate-pulse-glow"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">Loading policies...</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block card elevated overflow-hidden border border-brand-400/20">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-navy-700">
              <thead className="bg-gradient-to-r from-navy-900 via-brand-900 to-navy-900 dark:from-navy-950 dark:via-brand-950 dark:to-navy-950">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Policy Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Sum Assured
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-navy-900 divide-y divide-gray-200 dark:divide-navy-700">
                {policies?.data && policies.data.length > 0 ? (
                  policies.data.map((policy) => (
                    <tr key={policy.id} className="hover:bg-cyan-50 dark:hover:bg-cyan-950/10 transition-all duration-200 group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-brand rounded-lg shadow-glow-brand group-hover:scale-110 transition-transform duration-200">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">{policy.policyNumber}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {policy.user?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {policy.user?.email || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">{formatCurrency(parseFloat(policy.sumAssured))}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{policy.insuranceCompany?.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {format(new Date(policy.uploadedAt), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {format(new Date(policy.uploadedAt), 'hh:mm a')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const cls = policy.status === 'ACCEPTED'
                            ? 'status-active'
                            : policy.status === 'PENDING'
                            ? 'status-pending'
                            : policy.status === 'REJECTED'
                            ? 'status-rejected'
                            : policy.status === 'DRAFT'
                            ? 'status-inactive'
                            : 'status-inactive';
                          return <span className={cls}>{policy.status}</span>;
                        })()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-navy-800 dark:to-navy-900 rounded-2xl">
                          <Shield className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">
                            {searchQuery ? 'No policies found matching your search' : 'No policies found'}
                          </p>
                          {searchQuery && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                              Try adjusting your search criteria
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {policies && policies.pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 card p-4 sm:p-5 border border-brand-400/20">
              <div className="text-sm text-gray-700 dark:text-gray-300 text-center sm:text-left">
                Showing <span className="font-bold text-brand-600 dark:text-cyan-400">{((page - 1) * limit) + 1}</span> to{' '}
                <span className="font-bold text-brand-600 dark:text-cyan-400">{Math.min(page * limit, policies.pagination.total)}</span> of{' '}
                <span className="font-bold text-brand-600 dark:text-cyan-400">{policies.pagination.total}</span> results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2.5 border-2 border-brand-500 dark:border-cyan-400 text-brand-600 dark:text-cyan-400 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gradient-brand hover:text-white hover:border-transparent transition-all font-semibold disabled:hover:bg-transparent disabled:hover:text-brand-600 dark:disabled:hover:text-cyan-400 hover:scale-105"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= policies.pagination.totalPages}
                  className="px-4 py-2.5 border-2 border-brand-500 dark:border-cyan-400 text-brand-600 dark:text-cyan-400 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gradient-brand hover:text-white hover:border-transparent transition-all font-semibold disabled:hover:bg-transparent disabled:hover:text-brand-600 dark:disabled:hover:text-cyan-400 hover:scale-105"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {policies?.data && policies.data.length > 0 ? (
              policies.data.map((policy) => (
                <div key={policy.id} className="card p-5 border border-brand-400/20 hover:border-brand-400 hover:shadow-glow-brand transition-all duration-300">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-gradient-brand rounded-lg shadow-glow-brand">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{policy.policyNumber}</div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">User:</span>
                      <span className="text-gray-900 dark:text-white font-semibold">{policy.user?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Sum Assured:</span>
                      <span className="text-cyan-600 dark:text-cyan-400 font-bold">{formatCurrency(parseFloat(policy.sumAssured))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Company:</span>
                      <span className="text-gray-900 dark:text-white font-semibold">{policy.insuranceCompany?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Uploaded:</span>
                      <span className="text-gray-900 dark:text-white">{format(new Date(policy.uploadedAt), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-navy-700">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Status:</span>
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
                        }`}
                      >
                        {policy.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="card p-8 text-center border border-brand-400/20">
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-navy-800 dark:to-navy-900 rounded-2xl">
                    <Shield className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {searchQuery ? 'No policies found matching your search' : 'No policies found'}
                  </p>
                  {searchQuery && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Try adjusting your search criteria
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

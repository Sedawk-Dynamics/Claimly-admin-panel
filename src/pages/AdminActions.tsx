import { useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';
import { AdminAction, PaginatedResponse } from '../types';
import { ChevronLeft, ChevronRight, History, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminActions() {
  const [actions, setActions] = useState<PaginatedResponse<AdminAction> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    loadActions();
  }, [page]);

  const loadActions = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getAdminActions(page, limit);
      if (data && data.data && Array.isArray(data.data)) {
        setActions(data);
      } else {
        setActions({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
        setError('Invalid response format from server');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load admin actions');
      setActions({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-fire rounded-xl blur-lg opacity-60 animate-pulse-glow-orange"></div>
          <div className="relative p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-glow-orange">
            <History className="w-7 h-7 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gradient-sunset">Admin Actions</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Complete history of all administrative actions</p>
        </div>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 border-2 border-orange-400 dark:border-orange-500 text-orange-700 dark:text-orange-400 px-5 py-4 rounded-xl shadow-glow-orange">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 animate-pulse" />
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 dark:border-orange-900 border-t-orange-500 dark:border-t-orange-400"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-fire opacity-20 blur-xl animate-pulse-glow-orange"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">Loading admin actions...</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block card elevated overflow-hidden border border-orange-400/20">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-navy-700">
              <thead className="bg-gradient-to-r from-navy-900 via-orange-900/50 to-navy-900 dark:from-navy-950 dark:via-orange-950/50 dark:to-navy-950">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-navy-900 divide-y divide-gray-200 dark:divide-navy-700">
                {actions?.data && actions.data.length > 0 ? (
                  actions.data.map((action) => (
                    <tr key={action.id} className="hover:bg-orange-50 dark:hover:bg-orange-950/10 transition-all duration-200 group">
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-gradient-sunset rounded-lg shadow-glow-orange group-hover:scale-110 transition-transform duration-200">
                            <History className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">{action.actionType}</div>
                            {action.notes && (
                              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{action.notes}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {action.admin?.email || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {action.admin?.role?.toLowerCase().replace('_', ' ') || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {action.user?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {action.user?.email || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {format(new Date(action.createdAt), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(action.createdAt), 'hh:mm a')}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-navy-800 dark:to-navy-900 rounded-2xl">
                          <History className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">No admin actions found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {actions && actions.pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 card p-4 sm:p-5 border border-orange-400/20">
              <div className="text-sm text-gray-700 dark:text-gray-300 text-center sm:text-left">
                Showing <span className="font-bold text-orange-500 dark:text-orange-400">{((page - 1) * limit) + 1}</span> to{' '}
                <span className="font-bold text-orange-500 dark:text-orange-400">{Math.min(page * limit, actions.pagination.total)}</span> of{' '}
                <span className="font-bold text-orange-500 dark:text-orange-400">{actions.pagination.total}</span> results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2.5 border-2 border-orange-400 dark:border-orange-500 text-orange-500 dark:text-orange-400 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gradient-sunset hover:text-white hover:border-transparent transition-all font-semibold disabled:hover:bg-transparent disabled:hover:text-orange-500 dark:disabled:hover:text-orange-400 hover:scale-105"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= actions.pagination.totalPages}
                  className="px-4 py-2.5 border-2 border-orange-400 dark:border-orange-500 text-orange-500 dark:text-orange-400 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gradient-sunset hover:text-white hover:border-transparent transition-all font-semibold disabled:hover:bg-transparent disabled:hover:text-orange-500 dark:disabled:hover:text-orange-400 hover:scale-105"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {actions?.data && actions.data.length > 0 ? (
              actions.data.map((action) => (
                <div key={action.id} className="card p-5 border border-orange-400/20 hover:border-orange-400 hover:shadow-glow-orange transition-all duration-300">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="p-2 bg-gradient-sunset rounded-lg shadow-glow-orange">
                      <History className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{action.actionType}</div>
                      {action.notes && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 break-words">{action.notes}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-700 dark:text-gray-300 space-y-2 pt-3 border-t border-gray-200 dark:border-navy-700">
                    <div>
                      <span className="font-semibold text-orange-600 dark:text-orange-400">Admin:</span> {action.admin?.email || 'N/A'}
                    </div>
                    <div>
                      <span className="font-semibold text-orange-600 dark:text-orange-400">User:</span> {action.user?.name || 'N/A'} ({action.user?.email || 'N/A'})
                    </div>
                    <div>
                      <span className="font-semibold text-orange-600 dark:text-orange-400">Date:</span> {format(new Date(action.createdAt), 'MMM dd, yyyy hh:mm a')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="card p-8 text-center border border-orange-400/20">
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-navy-800 dark:to-navy-900 rounded-2xl">
                    <History className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">No admin actions found</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

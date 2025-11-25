import { useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';
import { AdminAction, PaginatedResponse } from '../types';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';
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
      // Ensure data has the expected structure
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
    <div>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Actions</h1>
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
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {actions?.data && actions.data.length > 0 ? (
                  actions.data.map((action) => (
                    <tr key={action.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <History className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{action.actionType}</div>
                          {action.notes && (
                            <div className="text-sm text-gray-500 mt-1">{action.notes}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {action.admin?.email || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">
                        {action.admin?.role?.toLowerCase().replace('_', ' ') || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {action.user?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {action.user?.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(action.createdAt), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(action.createdAt), 'hh:mm a')}
                      </div>
                    </td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                      No admin actions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {actions && actions.pagination.totalPages > 1 && (
            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, actions.pagination.total)} of{' '}
                {actions.pagination.total} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= actions.pagination.totalPages}
                  className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
          {actions?.data && actions.data.length > 0 ? (
            actions.data.map((action) => (
              <div key={action.id} className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-start space-x-2 mb-3">
                  <History className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{action.actionType}</div>
                    {action.notes && (
                      <div className="text-xs text-gray-500 mt-1 break-words">{action.notes}</div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-600 space-y-1 pt-3 border-t border-gray-100">
                  <div>
                    <span className="font-medium">Admin:</span> {action.admin?.email || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">User:</span> {action.user?.name || 'N/A'} ({action.user?.email || 'N/A'})
                  </div>
                  <div>
                    <span className="font-medium">Date:</span> {format(new Date(action.createdAt), 'MMM dd, yyyy hh:mm a')}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-500">No admin actions found</p>
            </div>
          )}
        </div>
        </>
      )}
    </div>
  );
}


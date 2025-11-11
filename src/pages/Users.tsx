import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/admin.service';
import { User, PaginatedResponse } from '../types';
import { Search, ChevronLeft, ChevronRight, UserCheck, UserX, Eye, X, Users as UsersIcon } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState<PaginatedResponse<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const limit = 20;
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getUsers(page, limit, search || undefined);
      // Ensure data has the expected structure
      if (data && data.data && Array.isArray(data.data)) {
        setUsers(data);
      } else {
        setUsers({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
        setError('Invalid response format from server');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load users');
      setUsers({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSearch = searchInput.trim();
    setSearch(trimmedSearch);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const handleViewDetails = (userId: string) => {
    navigate(`/users/${userId}`);
  };

  const handleStatusChange = async (userId: string, status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED') => {
    try {
      await adminService.updateUserStatus(userId, status);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update user status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <UsersIcon className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Users</h1>
            {users && (
              <p className="text-sm text-gray-500 mt-1">
                {users.pagination.total} {users.pagination.total === 1 ? 'user' : 'users'} total
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="w-full max-w-2xl">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <Search className="w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by email, name, or phone..."
            className="w-full pl-12 pr-24 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-20 flex items-center pr-2 text-gray-400 hover:text-gray-600 transition-colors group/clear"
              title="Clear search"
            >
              <div className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </div>
            </button>
          )}
          <button
            type="submit"
            className="absolute inset-y-0 right-0 flex items-center px-6 bg-primary-600 text-white rounded-r-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Search'
            )}
          </button>
        </div>
        {search && (
          <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
            <span>Searching for:</span>
            <span className="font-medium text-gray-900">"{search}"</span>
            <button
              onClick={handleClearSearch}
              className="text-primary-600 hover:text-primary-700 underline"
            >
              Clear
            </button>
          </div>
        )}
      </form>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-r-lg shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <X className="w-5 h-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
          <p className="text-gray-500 text-sm">Loading users...</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users?.data && users.data.length > 0 ? (
                    users.data.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{user.mobileNumber || '—'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                              user.subscriptionStatus
                            )}`}
                          >
                            {user.subscriptionStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewDetails(user.id)}
                              className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all"
                              title="View details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            {user.subscriptionStatus !== 'ACTIVE' && (
                              <button
                                onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all"
                                title="Activate"
                              >
                                <UserCheck className="w-5 h-5" />
                              </button>
                            )}
                            {user.subscriptionStatus !== 'INACTIVE' && (
                              <button
                                onClick={() => handleStatusChange(user.id, 'INACTIVE')}
                                className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
                                title="Deactivate"
                              >
                                <UserX className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <UsersIcon className="w-12 h-12 text-gray-300" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">No users found</p>
                            {search && (
                              <p className="text-sm text-gray-500 mt-1">
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
          </div>

          {/* Pagination */}
          {users && users.pagination.totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 bg-white px-6 py-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-sm text-gray-700">
                Showing <span className="font-semibold text-gray-900">{((page - 1) * limit) + 1}</span> to{' '}
                <span className="font-semibold text-gray-900">{Math.min(page * limit, users.pagination.total)}</span> of{' '}
                <span className="font-semibold text-gray-900">{users.pagination.total}</span> results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gray-400 transition-all font-medium text-gray-700 disabled:hover:bg-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="px-4 py-2 text-sm font-medium text-gray-700">
                  Page {page} of {users.pagination.totalPages}
                </div>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= users.pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gray-400 transition-all font-medium text-gray-700 disabled:hover:bg-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}


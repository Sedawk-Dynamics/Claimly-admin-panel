import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/admin.service';
import { User, PaginatedResponse } from '../types';
import { Search, ChevronLeft, ChevronRight, UserCheck, UserX, Eye, X, Users as UsersIcon, Sparkles } from 'lucide-react';
import api from '../services/api';

export default function Users() {
  const [users, setUsers] = useState<PaginatedResponse<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 25;
  const navigate = useNavigate();

  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return '-';
    // If it's already a formatted date string like '1990-01-01', return it
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString();
  };

  useEffect(() => {
    loadUsers();
  }, [page, searchQuery]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getUsers(page, limit, searchQuery || undefined);
      if (data && data.data && Array.isArray(data.data)) {
        setUsers(data);
      } else {
        setUsers({ data: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } });
        setError('Invalid response format from server');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load users');
      setUsers({ data: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } });
    } finally {
      setLoading(false);
    }
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'status-active';
      case 'INACTIVE':
        return 'status-inactive';
      case 'EXPIRED':
        return 'status-expired';
      default:
        return 'badge';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-brand rounded-xl blur-lg opacity-60 animate-pulse-glow"></div>
            <div className="relative p-3 bg-gradient-to-br from-brand-500 to-cyan-400 rounded-xl shadow-glow-brand">
              <UsersIcon className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gradient-brand">Users</h1>
            {users && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-500" />
                <span><strong>{users.pagination.total}</strong> {users.pagination.total === 1 ? 'user' : 'users'} total</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="w-full max-w-2xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cyan-500 dark:text-cyan-400 w-5 h-5 z-10" />
          <input
            type="text"
            placeholder="Search users by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-12 pr-4 py-3.5 border-2 border-cyan-400/30 dark:border-cyan-500/30 rounded-xl bg-white dark:bg-navy-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-400 dark:focus:ring-cyan-500 focus:border-cyan-400 dark:focus:border-cyan-500 transition-all duration-300 shadow-md hover:shadow-glow-cyan placeholder:text-gray-400"
          />
        </div>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 border-l-4 border-orange-500 text-orange-700 dark:text-orange-400 px-5 py-4 rounded-r-xl shadow-glow-orange">
          <div className="flex items-center space-x-3">
            <X className="w-5 h-5 text-orange-500 animate-pulse" />
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-200 dark:border-cyan-900 border-t-brand-500 dark:border-t-cyan-400"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-brand opacity-20 blur-xl animate-pulse-glow"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">Loading users...</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block card elevated overflow-hidden border border-cyan-400/20">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-navy-700">
                <thead className="bg-gradient-to-r from-navy-900 via-brand-900 to-navy-900 dark:from-navy-950 dark:via-brand-950 dark:to-navy-950">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      DOB
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-navy-900 divide-y divide-gray-200 dark:divide-navy-700">
                  {users?.data && users.data.length > 0 ? (
                    users.data.map((user) => (
                      <tr key={user.id} className="hover:bg-cyan-50 dark:hover:bg-cyan-950/10 transition-all duration-200 group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.profilePicture ? (
                              <img
                                src={user.profilePicture.startsWith('http') ? user.profilePicture : `${api.defaults.baseURL || window.location.origin}${user.profilePicture.startsWith('/') ? user.profilePicture : `/${user.profilePicture}`}`}
                                alt={user.name}
                                className="flex-shrink-0 h-11 w-11 rounded-full object-cover border-2 border-brand-200 dark:border-brand-700 shadow-glow-orange group-hover:scale-110 transition-transform duration-200"
                              />
                            ) : (
                              <div className="flex-shrink-0 h-11 w-11 rounded-full bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center text-white font-bold text-base shadow-glow-orange group-hover:scale-110 transition-transform duration-200">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700 dark:text-gray-300">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700 dark:text-gray-300">{user.mobileNumber || '—'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700 dark:text-gray-300">{formatDate(user.dob)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`${getStatusBadge(user.subscriptionStatus)}`}>
                            {user.subscriptionStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewDetails(user.id)}
                              className="p-2.5 text-brand-600 dark:text-cyan-400 hover:text-white hover:bg-gradient-brand rounded-lg transition-all shadow-md hover:shadow-glow-brand hover:scale-110"
                              title="View details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            {user.subscriptionStatus !== 'ACTIVE' && (
                              <button
                                onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                                className="p-2.5 text-cyan-600 dark:text-cyan-400 hover:text-white hover:bg-gradient-cyan rounded-lg transition-all shadow-md hover:shadow-glow-cyan hover:scale-110"
                                title="Activate"
                              >
                                <UserCheck className="w-5 h-5" />
                              </button>
                            )}
                            {user.subscriptionStatus !== 'INACTIVE' && (
                              <button
                                onClick={() => handleStatusChange(user.id, 'INACTIVE')}
                                className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-white hover:bg-gray-600 dark:hover:bg-gray-700 rounded-lg transition-all shadow-md hover:scale-110"
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
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-navy-800 dark:to-navy-900 rounded-2xl">
                            <UsersIcon className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                          </div>
                          <div>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">No users found</p>
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
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {users?.data && users.data.length > 0 ? (
              users.data.map((user) => (
                <div key={user.id} className="card p-5 border border-cyan-400/20 hover:border-cyan-400 hover:shadow-glow-cyan transition-all duration-300">
                    <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture.startsWith('http') ? user.profilePicture : `${api.defaults.baseURL || window.location.origin}${user.profilePicture.startsWith('/') ? user.profilePicture : `/${user.profilePicture}`}`}
                          alt={user.name}
                          className="flex-shrink-0 h-12 w-12 rounded-full object-cover border-2 border-brand-200 dark:border-brand-700 shadow-glow-orange"
                        />
                      ) : (
                        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center text-white font-bold shadow-glow-orange">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">{user.email}</div>
                      </div>
                    </div>
                    <span className={`${getStatusBadge(user.subscriptionStatus)} flex-shrink-0 ml-2`}>
                      {user.subscriptionStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-navy-700">
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                      {user.mobileNumber || 'No phone'}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewDetails(user.id)}
                        className="p-2 text-brand-600 dark:text-cyan-400 hover:bg-gradient-brand hover:text-white rounded-lg transition-all"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {user.subscriptionStatus !== 'ACTIVE' && (
                        <button
                          onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                          className="p-2 text-cyan-600 dark:text-cyan-400 hover:bg-gradient-cyan hover:text-white rounded-lg transition-all"
                          title="Activate"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                      {user.subscriptionStatus !== 'INACTIVE' && (
                        <button
                          onClick={() => handleStatusChange(user.id, 'INACTIVE')}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-600 hover:text-white rounded-lg transition-all"
                          title="Deactivate"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="card p-8 text-center border border-cyan-400/20">
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-navy-800 dark:to-navy-900 rounded-2xl">
                    <UsersIcon className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">No users found</p>
                  {searchQuery && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Try adjusting your search criteria
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {users && users.pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 card p-4 sm:p-5 border border-cyan-400/20">
              <div className="text-sm text-gray-700 dark:text-gray-300 text-center sm:text-left">
                Showing <span className="font-bold text-brand-600 dark:text-cyan-400">{((page - 1) * limit) + 1}</span> to{' '}
                <span className="font-bold text-brand-600 dark:text-cyan-400">{Math.min(page * limit, users.pagination.total)}</span> of{' '}
                <span className="font-bold text-brand-600 dark:text-cyan-400">{users.pagination.total}</span> results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2.5 border-2 border-brand-500 dark:border-cyan-400 text-brand-600 dark:text-cyan-400 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gradient-brand hover:text-white hover:border-transparent transition-all font-semibold disabled:hover:bg-transparent disabled:hover:text-brand-600 dark:disabled:hover:text-cyan-400 hover:scale-105"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                  Page <span className="text-brand-600 dark:text-cyan-400">{page}</span> of <span className="text-brand-600 dark:text-cyan-400">{users.pagination.totalPages}</span>
                </div>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= users.pagination.totalPages}
                  className="px-4 py-2.5 border-2 border-brand-500 dark:border-cyan-400 text-brand-600 dark:text-cyan-400 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gradient-brand hover:text-white hover:border-transparent transition-all font-semibold disabled:hover:bg-transparent disabled:hover:text-brand-600 dark:disabled:hover:text-cyan-400 hover:scale-105"
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

import { useState, useEffect } from 'react';
import { adminService } from '../services/admin.service';
import { Send, Bell, Users, User, Hash, CheckSquare } from 'lucide-react';
import { User as UserType, PaginatedResponse } from '../types';

type NotificationMode = 'single' | 'all' | 'count' | 'selected';

export default function Notifications() {
  const [mode, setMode] = useState<NotificationMode>('single');
  const [userId, setUserId] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userCount, setUserCount] = useState<number>(10);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // For user selection in 'selected' mode
  const [users, setUsers] = useState<PaginatedResponse<UserType> | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userPage, setUserPage] = useState(1);
  const userLimit = 20;

  useEffect(() => {
    if (mode === 'selected') {
      loadUsers();
    }
  }, [mode, userPage, userSearchQuery]);

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const data = await adminService.getUsers(userPage, userLimit, userSearchQuery || undefined);
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (!users) return;
    const allUserIds = users.data.map((u) => u.id);
    if (selectedUserIds.length === allUserIds.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(allUserIds);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title || !message) {
      setError('Title and message are required');
      return;
    }

    try {
      setLoading(true);
      
      let payload: {
        mode: NotificationMode;
        user_ids?: string[];
        count?: number;
        title: string;
        message: string;
      } = {
        mode,
        title,
        message,
      };

      switch (mode) {
        case 'single':
          if (!userId) {
            setError('User ID is required');
            return;
          }
          payload.user_ids = [userId];
          break;
        case 'selected':
          if (!selectedUserIds || selectedUserIds.length === 0) {
            setError('Please select at least one user');
            return;
          }
          payload.user_ids = selectedUserIds;
          break;
        case 'count':
          if (!userCount || userCount <= 0) {
            setError('Please enter a valid number of users');
            return;
          }
          payload.count = userCount;
          break;
        case 'all':
          // No additional fields needed
          break;
      }

      const result = await adminService.sendBulkNotification(payload);
      
      if (result.failed === 0) {
        setSuccess(`Notification sent successfully to ${result.success} user(s)`);
      } else {
        setSuccess(
          `Notification sent to ${result.success} user(s), ${result.failed} failed`
        );
        if (result.errors.length > 0) {
          console.error('Notification errors:', result.errors);
        }
      }
      
      // Reset form
      setTitle('');
      setMessage('');
      setUserId('');
      setSelectedUserIds([]);
      setUserCount(10);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-brand rounded-xl blur-lg opacity-60 animate-pulse-glow" />
          <div className="relative p-3 bg-gradient-to-br from-brand-500 to-cyan-400 rounded-xl shadow-glow-brand">
            <Bell className="w-7 h-7 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gradient-brand">Notifications</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Send in-app notifications to users.
          </p>
        </div>
      </div>

      <div className="card p-6 w-full border border-cyan-400/20">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Send To
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode('single');
                  setSelectedUserIds([]);
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  mode === 'single'
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                    : 'border-gray-300 dark:border-navy-600 hover:border-cyan-300'
                }`}
              >
                <User className="w-5 h-5 mx-auto mb-2 text-cyan-500" />
                <div className="text-sm font-medium">Single User</div>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setMode('selected');
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  mode === 'selected'
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                    : 'border-gray-300 dark:border-navy-600 hover:border-cyan-300'
                }`}
              >
                <CheckSquare className="w-5 h-5 mx-auto mb-2 text-cyan-500" />
                <div className="text-sm font-medium">Selected Users</div>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setMode('count');
                  setSelectedUserIds([]);
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  mode === 'count'
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                    : 'border-gray-300 dark:border-navy-600 hover:border-cyan-300'
                }`}
              >
                <Hash className="w-5 h-5 mx-auto mb-2 text-cyan-500" />
                <div className="text-sm font-medium">Number of Users</div>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setMode('all');
                  setSelectedUserIds([]);
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  mode === 'all'
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                    : 'border-gray-300 dark:border-navy-600 hover:border-cyan-300'
                }`}
              >
                <Users className="w-5 h-5 mx-auto mb-2 text-cyan-500" />
                <div className="text-sm font-medium">All Users</div>
              </button>
            </div>
          </div>

          {/* Single User Mode */}
          {mode === 'single' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                User ID
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user ID"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-600 bg-white dark:bg-navy-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>
          )}

          {/* Selected Users Mode */}
          {mode === 'selected' && (
            <div className="w-full">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Users ({selectedUserIds.length} selected)
                </label>
                {users && users.data.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-sm text-cyan-500 hover:text-cyan-600 font-medium"
                  >
                    {selectedUserIds.length === users.data.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>
              
              {/* User Search */}
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => {
                  setUserSearchQuery(e.target.value);
                  setUserPage(1);
                }}
                placeholder="Search users by name, email, or mobile..."
                className="w-full px-3 py-2 mb-3 rounded-lg border border-gray-300 dark:border-navy-600 bg-white dark:bg-navy-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
              
              {/* User List */}
              <div className="max-h-[640px] overflow-y-auto border border-gray-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-900 w-full">
                {usersLoading ? (
                  <div className="p-4 text-center text-gray-500">Loading users...</div>
                ) : users && users.data.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-navy-700">
                    {users.data.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-navy-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => handleUserToggle(user.id)}
                          className="w-4 h-4 text-cyan-500 rounded border-gray-300 dark:border-navy-600 focus:ring-cyan-500"
                        />
                        <div className="ml-3 flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email} • {user.mobileNumber}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">No users found</div>
                )}
              </div>
              
              {/* Pagination */}
              {users && users.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-3">
                  <button
                    type="button"
                    onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                    disabled={userPage === 1}
                    className="px-3 py-1 rounded-lg border border-gray-300 dark:border-navy-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-navy-800"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {userPage} of {users.pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setUserPage((p) => Math.min(users.pagination.totalPages, p + 1))}
                    disabled={userPage === users.pagination.totalPages}
                    className="px-3 py-1 rounded-lg border border-gray-300 dark:border-navy-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-navy-800"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Count Mode */}
          {mode === 'count' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Number of Users
              </label>
              <input
                type="number"
                min="1"
                value={userCount}
                onChange={(e) => setUserCount(parseInt(e.target.value) || 1)}
                placeholder="Enter number of users"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-600 bg-white dark:bg-navy-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Notifications will be sent to the first {userCount} users (ordered by creation date)
              </p>
            </div>
          )}

          {/* All Users Mode */}
          {mode === 'all' && (
            <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
              <p className="text-sm text-cyan-700 dark:text-cyan-300">
                Notifications will be sent to all users in the system.
              </p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-600 bg-white dark:bg-navy-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter notification message"
              rows={6}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-600 bg-white dark:bg-navy-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-brand text-white font-semibold shadow-glow-brand disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 mr-2" />
            {loading ? 'Sending...' : 'Send Notification'}
          </button>
        </form>
      </div>
    </div>
  );
}

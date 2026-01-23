import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { authService } from '../services/auth.service';
import {
  agentService,
  AgentReferredUser,
  AgentReferralStats,
  AgentReferralTransaction,
} from '../services/agent.service';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AgentDashboard() {
  const { setTheme } = useTheme();
  const navigate = useNavigate();
  const agent = authService.getStoredAdmin();
  const [referralCode, setReferralCode] = useState<string>('');
  const [users, setUsers] = useState<AgentReferredUser[]>([]);
  const [stats, setStats] = useState<AgentReferralStats | null>(null);
  const [transactions, setTransactions] = useState<AgentReferralTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // Force light mode for agent dashboard
    setTheme('light');
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
  }, [setTheme]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        const [codeInfo, referralData] = await Promise.all([
          agentService.getReferralCode(),
          agentService.getReferrals(),
        ]);
        setReferralCode(codeInfo.referralCode);
        setUsers(referralData.referrals);
        setStats(referralData.stats);
        setTransactions(referralData.transactions);
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'Failed to load agent referral data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCopy = () => {
    if (!referralCode) return;
    navigator.clipboard?.writeText(referralCode).catch(() => {});
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.mobileNumber.toLowerCase().includes(query) ||
        u.id.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Paginate filtered users
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 py-6 sm:py-8">
      <div className="w-full max-w-5xl space-y-6 sm:space-y-8">
        {/* Profile + quick actions */}
        <div className="card border border-gray-200 shadow-card-3d p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-cyan-400 text-white text-lg sm:text-xl font-semibold">
              {agent?.email?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Agent Panel</h1>
              {agent && (
                <>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">{agent.email}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Role: <span className="uppercase tracking-wide font-semibold">{agent.role}</span>
                  </p>
                </>
              )}
              {!agent && (
                <p className="text-sm text-red-600">
                  Session information not found. Please log in again.
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex justify-center items-center px-4 py-2 rounded-lg text-sm font-semibold border border-red-500 text-red-600 hover:bg-red-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Referral code + errors */}
        <div className="card border border-gray-200 shadow-card-3d p-4 sm:p-6">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Your Referral Code</h2>
            {loading && !referralCode ? (
              <p className="text-gray-500 text-sm">Loading referral code...</p>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1 px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-center font-mono text-lg tracking-widest break-all">
                  {referralCode || 'N/A'}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!referralCode}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-sunset text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Copy
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500">
              Share this code with users. When they sign up using this code and subscribe, they will be linked to you and you will earn commission.
            </p>
          </div>
        </div>

        {stats && (
          <div className="card border border-gray-200 shadow-card-3d p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
              Referral Earnings Summary
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="text-xs uppercase text-gray-500 font-semibold">Referred Users</div>
                <div className="mt-1 text-xl font-bold text-gray-800">
                  {stats.totalReferredUsers}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="text-xs uppercase text-gray-500 font-semibold">Subscribed Users</div>
                <div className="mt-1 text-xl font-bold text-gray-800">
                  {stats.totalSubscribedUsers}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="text-xs uppercase text-gray-500 font-semibold">Total Earnings</div>
                <div className="mt-1 text-xl font-bold text-emerald-700">
                  ₹{stats.totalCommissionAmount.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="card border border-gray-200 shadow-card-3d p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
              Users Who Used Your Referral Code
            </h2>
            {!loading && users.length > 0 && (
              <div className="text-sm text-gray-500">
                Showing {paginatedUsers.length} of {filteredUsers.length} users
              </div>
            )}
          </div>

          {/* Search Bar */}
          {!loading && users.length > 0 && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, phone, or ID..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm"
                />
              </div>
            </div>
          )}

          {loading && (
            <p className="text-gray-500 text-sm">Loading referred users...</p>
          )}

          {!loading && users.length === 0 && (
            <p className="text-gray-500 text-sm">No users have used your referral code yet.</p>
          )}

          {!loading && users.length > 0 && filteredUsers.length === 0 && (
            <p className="text-gray-500 text-sm">No users found matching your search.</p>
          )}

          {/* Mobile: card layout */}
          {!loading && paginatedUsers.length > 0 && (
            <>
              <div className="space-y-3 sm:hidden max-h-[600px] overflow-y-auto">
                {paginatedUsers.map((u) => (
                  <div
                    key={u.id}
                    className="card p-3 border border-brand-400/20 hover:border-brand-400/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {u.name || 'Unnamed user'}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 break-all">
                          ID: {u.id}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="badge badge-info text-[10px] px-2 py-0.5">
                          {u.hasSubscription ? 'Subscribed' : 'Not Subscribed'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-start space-x-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                            {u.email || 'No email'}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            {u.mobileNumber}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 mb-2 text-center text-[10px] font-semibold">
                      <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300">
                        <p className="text-[9px] uppercase tracking-wide">Joined</p>
                        <p className="text-sm font-bold">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        <p className="text-[9px] uppercase tracking-wide">Earnings</p>
                        <p className="text-sm font-bold">
                          {u.commissionAmount > 0 ? `₹${u.commissionAmount.toFixed(2)}` : '₹0.00'}
                        </p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-gray-500/10 text-gray-700 dark:text-gray-300">
                        <p className="text-[9px] uppercase tracking-wide">Status</p>
                        <p className="text-sm font-bold">
                          {u.hasSubscription ? 'Active' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: table layout */}
              <div className="hidden sm:block">
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 font-semibold text-gray-700">Name</th>
                        <th className="px-4 py-2 font-semibold text-gray-700">Email</th>
                        <th className="px-4 py-2 font-semibold text-gray-700">Phone</th>
                        <th className="px-4 py-2 font-semibold text-gray-700">Joined</th>
                        <th className="px-4 py-2 font-semibold text-gray-700">Subscribed</th>
                        <th className="px-4 py-2 font-semibold text-gray-700">Earnings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.map((u) => (
                        <tr key={u.id} className="border-b last:border-0">
                          <td className="px-4 py-2 text-gray-800">{u.name}</td>
                          <td className="px-4 py-2 text-gray-700">{u.email || '-'}</td>
                          <td className="px-4 py-2 text-gray-700">{u.mobileNumber}</td>
                          <td className="px-4 py-2 text-gray-500">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-gray-700">
                            {u.hasSubscription ? 'Yes' : 'No'}
                          </td>
                          <td className="px-4 py-2 text-gray-700">
                            {u.commissionAmount > 0 ? `₹${u.commissionAmount.toFixed(2)}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages} ({filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'})
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-700 px-2">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {transactions.length > 0 && (
          <div className="card border border-gray-200 shadow-card-3d p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
              Referral Earnings History
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 font-semibold text-gray-700">Date</th>
                    <th className="px-4 py-2 font-semibold text-gray-700">User</th>
                    <th className="px-4 py-2 font-semibold text-gray-700">Plan</th>
                    <th className="px-4 py-2 font-semibold text-gray-700">Subscription Amount</th>
                    <th className="px-4 py-2 font-semibold text-gray-700">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="px-4 py-2 text-gray-500">
                        {new Date(t.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-gray-800">{t.userName}</td>
                      <td className="px-4 py-2 text-gray-700">{t.planName}</td>
                      <td className="px-4 py-2 text-gray-700">₹{t.amount.toFixed(2)}</td>
                      <td className="px-4 py-2 text-emerald-700 font-semibold">
                        ₹{t.commissionAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



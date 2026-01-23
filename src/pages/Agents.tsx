import { useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';
import { Search, ChevronLeft, ChevronRight, UserCheck, UserX, Shield, Sparkles, XCircle, Trash2, ShieldOff } from 'lucide-react';
import TruncatedText from '../components/TruncatedText';

interface Agent {
  id: string;
  name: string;
  email: string;
  mobileNumber: string | null;
  role: string;
  isVerified: boolean;
  verifiedBy: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
}

interface AgentsResponse {
  agents: Agent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function Agents() {
  const [agents, setAgents] = useState<AgentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [verifying, setVerifying] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const limit = 25;

  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString();
  };

  useEffect(() => {
    loadAgents();
  }, [page, searchQuery]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getAgents(page, limit, searchQuery || undefined);
      setAgents(data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load agents');
      setAgents({ agents: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (agentId: string) => {
    if (!confirm('Are you sure you want to verify this agent?')) return;

    try {
      setVerifying(agentId);
      await adminService.verifyAgent(agentId);
      loadAgents();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to verify agent');
    } finally {
      setVerifying(null);
    }
  };

  const handleRevokeVerification = async (agentId: string) => {
    if (!confirm('Are you sure you want to revoke verification for this agent? The agent will need to be verified again.')) return;

    try {
      setRevoking(agentId);
      await adminService.revokeAgentVerification(agentId);
      loadAgents();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to revoke verification');
    } finally {
      setRevoking(null);
    }
  };

  const handleReject = async (agentId: string) => {
    if (!confirm('Are you sure you want to reject this agent? This will permanently delete the agent record.')) return;

    try {
      setRejecting(agentId);
      await adminService.rejectAgent(agentId);
      loadAgents();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject agent');
    } finally {
      setRejecting(null);
    }
  };

  const handleDelete = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) return;

    try {
      setDeleting(agentId);
      await adminService.deleteAgent(agentId);
      loadAgents();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete agent');
    } finally {
      setDeleting(null);
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
              <Shield className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gradient-brand">Agents</h1>
            {agents && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-500" />
                <span><strong>{agents.pagination.total}</strong> {agents.pagination.total === 1 ? 'agent' : 'agents'} total</span>
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
            placeholder="Search agents by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-12 pr-4 py-3.5 border-2 border-cyan-400/30 dark:border-cyan-500/30 rounded-xl bg-white dark:bg-navy-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-400 dark:focus:ring-cyan-500 focus:border-cyan-400 dark:focus:border-cyan-500 transition-all duration-300 shadow-md hover:shadow-glow-cyan placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 border-l-4 border-orange-500 text-orange-700 dark:text-orange-400 px-5 py-4 rounded-r-xl shadow-glow-orange">
          <div className="flex items-center space-x-3">
            <XCircle className="w-5 h-5 text-orange-500 animate-pulse" />
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* Agents Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-200 dark:border-cyan-900 border-t-brand-500 dark:border-t-cyan-400"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-brand opacity-20 blur-xl animate-pulse-glow"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">Loading agents...</p>
        </div>
      ) : agents && agents.agents.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block card elevated overflow-hidden border border-cyan-400/20">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 dark:divide-navy-700 table-fixed">
                <colgroup>
                  <col className="w-[20%]" />
                  <col className="w-[25%]" />
                  <col className="w-[15%]" />
                  <col className="w-[12%]" />
                  <col className="w-[13%]" />
                  <col className="w-[15%]" />
                </colgroup>
                <thead className="bg-gradient-to-r from-navy-900 via-brand-900 to-navy-900 dark:from-navy-950 dark:via-brand-950 dark:to-navy-950">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-navy-900 divide-y divide-gray-200 dark:divide-navy-700">
                  {agents.agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-cyan-50 dark:hover:bg-cyan-950/10 transition-all duration-200">
                      <td className="px-4 py-4 overflow-hidden">
                        <TruncatedText 
                          text={agent.name} 
                          maxLength={20}
                          className="text-sm font-bold text-gray-900 dark:text-white block"
                        />
                      </td>
                      <td className="px-4 py-4 overflow-hidden">
                        <TruncatedText 
                          text={agent.email} 
                          maxLength={25}
                          className="text-sm text-gray-700 dark:text-gray-300 block"
                        />
                      </td>
                      <td className="px-4 py-4 overflow-hidden">
                        <TruncatedText 
                          text={agent.mobileNumber || '—'} 
                          maxLength={15}
                          className="text-sm text-gray-700 dark:text-gray-300 block"
                        />
                      </td>
                      <td className="px-4 py-4 overflow-hidden">
                        {agent.isVerified ? (
                          <span className="status-active flex items-center space-x-1">
                            <UserCheck className="w-4 h-4" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="status-inactive flex items-center space-x-1">
                            <UserX className="w-4 h-4" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 overflow-hidden">
                        <div className="text-sm text-gray-700 dark:text-gray-300 truncate">{formatDate(agent.createdAt)}</div>
                      </td>
                      <td className="px-4 py-4 overflow-hidden">
                        <div className="flex items-center space-x-2 flex-wrap">
                          {!agent.isVerified && (
                            <>
                              <button
                                onClick={() => handleVerify(agent.id)}
                                disabled={verifying === agent.id || revoking === agent.id || rejecting === agent.id || deleting === agent.id}
                                className="text-sm px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {verifying === agent.id ? 'Verifying...' : 'Verify'}
                              </button>
                              <button
                                onClick={() => handleReject(agent.id)}
                                disabled={verifying === agent.id || revoking === agent.id || rejecting === agent.id || deleting === agent.id}
                                className="flex items-center space-x-1 text-sm px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>{rejecting === agent.id ? 'Rejecting...' : 'Reject'}</span>
                              </button>
                            </>
                          )}
                          {agent.isVerified && (
                            <>
                              <button
                                onClick={() => handleRevokeVerification(agent.id)}
                                disabled={verifying === agent.id || revoking === agent.id || rejecting === agent.id || deleting === agent.id}
                                className="flex items-center space-x-1 text-sm px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ShieldOff className="w-4 h-4" />
                                <span>{revoking === agent.id ? 'Revoking...' : 'Revoke'}</span>
                              </button>
                              {agent.verifiedAt && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Verified {formatDate(agent.verifiedAt)}
                                </div>
                              )}
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(agent.id)}
                            disabled={verifying === agent.id || revoking === agent.id || rejecting === agent.id || deleting === agent.id}
                            className="flex items-center space-x-1 text-sm px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>{deleting === agent.id ? 'Deleting...' : 'Delete'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {agents.agents.map((agent) => (
              <div key={agent.id} className="card p-4 sm:p-5 border border-cyan-400/20 hover:border-cyan-400/40 transition-all">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <TruncatedText 
                      text={agent.name} 
                      maxLength={20}
                      className="text-base sm:text-lg font-bold text-gray-900 dark:text-white"
                    />
                    <TruncatedText 
                      text={agent.email} 
                      maxLength={25}
                      className="text-xs text-gray-500 dark:text-gray-400 mt-1"
                    />
                  </div>
                  <div className="flex-shrink-0">
                    {agent.isVerified ? (
                      <span className="status-active flex items-center space-x-1 text-xs">
                        <UserCheck className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="status-inactive flex items-center space-x-1 text-xs">
                        <UserX className="w-3 h-3" />
                        <span>Pending</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Phone:</span>
                    <span className="text-gray-900 dark:text-white">{agent.mobileNumber || '—'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Created:</span>
                    <span className="text-gray-900 dark:text-white">{formatDate(agent.createdAt)}</span>
                  </div>
                  {agent.isVerified && agent.verifiedAt && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Verified:</span>
                      <span className="text-gray-900 dark:text-white">{formatDate(agent.verifiedAt)}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200 dark:border-navy-700">
                  {!agent.isVerified && (
                    <>
                      <button
                        onClick={() => handleVerify(agent.id)}
                        disabled={verifying === agent.id || revoking === agent.id || rejecting === agent.id || deleting === agent.id}
                        className="flex-1 min-w-[100px] text-sm px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {verifying === agent.id ? 'Verifying...' : 'Verify'}
                      </button>
                      <button
                        onClick={() => handleReject(agent.id)}
                        disabled={verifying === agent.id || revoking === agent.id || rejecting === agent.id || deleting === agent.id}
                        className="flex items-center justify-center space-x-1 text-sm px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>{rejecting === agent.id ? 'Rejecting...' : 'Reject'}</span>
                      </button>
                    </>
                  )}
                  {agent.isVerified && (
                    <button
                      onClick={() => handleRevokeVerification(agent.id)}
                      disabled={verifying === agent.id || revoking === agent.id || rejecting === agent.id || deleting === agent.id}
                      className="flex items-center justify-center space-x-1 text-sm px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      <ShieldOff className="w-4 h-4" />
                      <span>{revoking === agent.id ? 'Revoking...' : 'Revoke'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(agent.id)}
                    disabled={verifying === agent.id || revoking === agent.id || rejecting === agent.id || deleting === agent.id}
                    className="flex items-center justify-center space-x-1 text-sm px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{deleting === agent.id ? 'Deleting...' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {agents.pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, agents.pagination.total)} of {agents.pagination.total} agents
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-300 dark:border-navy-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300 px-2">
                  Page {page} of {agents.pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= agents.pagination.totalPages}
                  className="p-2 rounded-lg border border-gray-300 dark:border-navy-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card text-center py-12 sm:py-16">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-navy-800 dark:to-navy-900 rounded-2xl">
              <Shield className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-600" />
            </div>
            <div>
              <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">No agents found</p>
              {searchQuery && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Try adjusting your search criteria
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

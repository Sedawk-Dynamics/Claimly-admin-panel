import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/admin.service';
import { AlertStats, Alert, PaginatedResponse, User, Company, Policy } from '../types';
import { 
  Users, Building2, FileText, Bell, AlertCircle, CheckCircle, XCircle, 
  ShieldCheck, Clock, TrendingUp, Activity, Eye, ArrowRight 
} from 'lucide-react';
import { format } from 'date-fns';

interface DashboardStats {
  alertStats: AlertStats | null;
  totalUsers: number;
  totalCompanies: number;
  totalPolicies: number;
  pendingKyc: number;
  pendingPolicyDocs: number;
  recentAlerts: Alert[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    alertStats: null,
    totalUsers: 0,
    totalCompanies: 0,
    totalPolicies: 0,
    pendingKyc: 0,
    pendingPolicyDocs: 0,
    recentAlerts: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAllStats();
  }, []);

  const loadAllStats = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all statistics in parallel
      const [
        alertStats,
        usersData,
        companiesData,
        policiesData,
        kycData,
        policyDocsData,
        recentAlertsData,
      ] = await Promise.all([
        adminService.getAlertStats().catch(() => null),
        adminService.getUsers(1, 1).catch(() => ({ data: [], pagination: { total: 0, page: 1, limit: 1, totalPages: 0 } })),
        adminService.getCompanies(1, 1).catch(() => ({ data: [], pagination: { total: 0, page: 1, limit: 1, totalPages: 0 } })),
        adminService.getPolicies(1, 1).catch(() => ({ data: [], pagination: { total: 0, page: 1, limit: 1, totalPages: 0 } })),
        adminService.getKycDocuments(1, 1, 'pending').catch(() => ({ data: [], pagination: { total: 0, page: 1, limit: 1, totalPages: 0 } })),
        adminService.getPolicyDocuments(1, 1, 'pending').catch(() => ({ data: [], pagination: { total: 0, page: 1, limit: 1, totalPages: 0 } })),
        adminService.getAlerts(1, 5, 'PENDING').catch(() => ({ data: [], pagination: { total: 0, page: 1, limit: 5, totalPages: 0 } })),
      ]);

      setStats({
        alertStats,
        totalUsers: usersData.pagination.total,
        totalCompanies: companiesData.pagination.total,
        totalPolicies: policiesData.pagination.total,
        pendingKyc: kycData.pagination.total,
        pendingPolicyDocs: policyDocsData.pagination.total,
        recentAlerts: recentAlertsData.data || [],
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={loadAllStats}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Overview Statistics */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            color="blue"
            href="/users"
          />
          <StatCard
            title="Companies"
            value={stats.totalCompanies}
            icon={Building2}
            color="purple"
            href="/companies"
          />
          <StatCard
            title="Total Policies"
            value={stats.totalPolicies}
            icon={FileText}
            color="indigo"
            href="/policies"
          />
          <StatCard
            title="Total Alerts"
            value={stats.alertStats?.total || 0}
            icon={Bell}
            color="orange"
            href="/alerts"
          />
        </div>
      </div>

      {/* Alert Statistics */}
      {stats.alertStats && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Alert Statistics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              title="Pending Alerts"
              value={stats.alertStats.pending}
              icon={AlertCircle}
              color="yellow"
              href="/alerts?status=PENDING"
            />
            <StatCard
              title="Verified Alerts"
              value={stats.alertStats.verified}
              icon={CheckCircle}
              color="green"
              href="/alerts?status=VERIFIED"
            />
            <StatCard
              title="False Alerts"
              value={stats.alertStats.falseAlerts}
              icon={XCircle}
              color="red"
              href="/alerts?status=FALSE_ALERT"
            />
            <StatCard
              title="SMS Alerts"
              value={stats.alertStats.smsAlerts || 0}
              icon={Bell}
              color="blue"
            />
          </div>
        </div>
      )}

      {/* Pending Reviews */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Pending Reviews</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <ReviewCard
            title="KYC Documents"
            count={stats.pendingKyc}
            icon={ShieldCheck}
            href="/kyc-review"
            color="yellow"
            description="Documents awaiting verification"
          />
          <ReviewCard
            title="Policy Documents"
            count={stats.pendingPolicyDocs}
            icon={FileText}
            href="/policy-review"
            color="orange"
            description="Policy documents pending review"
          />
        </div>
      </div>

      {/* Recent Alerts */}
      {stats.recentAlerts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Pending Alerts</h2>
            <Link
              to="/alerts"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              {stats.recentAlerts.map((alert) => (
                <Link
                  key={alert.id}
                  to="/alerts"
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Bell className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {alert.user?.name || 'Unknown User'}
                        </p>
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          {alert.alertType || 'ALERT'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {alert.user?.email || 'No email'} • {alert.user?.mobileNumber || 'No phone'}
                      </p>
                      {alert.remarks && (
                        <p className="text-xs text-gray-600 mt-1 truncate">{alert.remarks}</p>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0 text-right">
                      <p className="text-xs text-gray-500">
                        {format(new Date(alert.createdAt), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(alert.createdAt), 'hh:mm a')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <QuickLinkCard
            title="Users"
            description="Manage user accounts and subscriptions"
            icon={Users}
            href="/users"
          />
          <QuickLinkCard
            title="KYC Review"
            description="Review and verify user documents"
            icon={ShieldCheck}
            href="/kyc-review"
          />
          <QuickLinkCard
            title="Policy Review"
            description="Review and verify policy documents"
            icon={FileText}
            href="/policy-review"
          />
          <QuickLinkCard
            title="Companies"
            description="Manage insurance companies"
            icon={Building2}
            href="/companies"
          />
          <QuickLinkCard
            title="Policies"
            description="View and manage policies"
            icon={FileText}
            href="/policies"
          />
          <QuickLinkCard
            title="Alerts"
            description="View and manage alerts"
            icon={Bell}
            href="/alerts"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  href,
}: {
  title: string;
  value: number;
  icon: any;
  color: 'blue' | 'yellow' | 'green' | 'red' | 'purple' | 'indigo' | 'orange';
  href?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  const content = (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{value.toLocaleString()}</p>
        </div>
        <div className={`p-2 sm:p-3 rounded-full flex-shrink-0 ml-2 ${colorClasses[color]}`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
}

function ReviewCard({
  title,
  count,
  icon: Icon,
  href,
  color,
  description,
}: {
  title: string;
  count: number;
  icon: any;
  href: string;
  color: 'yellow' | 'orange' | 'red';
  description: string;
}) {
  const colorClasses = {
    yellow: 'bg-yellow-100 text-yellow-600 border-yellow-200',
    orange: 'bg-orange-100 text-orange-600 border-orange-200',
    red: 'bg-red-100 text-red-600 border-red-200',
  };

  return (
    <Link
      to={href}
      className="block bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition-shadow border-l-4"
      style={{ borderLeftColor: color === 'yellow' ? '#fbbf24' : color === 'orange' ? '#fb923c' : '#ef4444' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Icon className="w-5 h-5 text-gray-600" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-3">{description}</p>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-2xl sm:text-3xl font-bold text-gray-900">{count.toLocaleString()}</span>
            <span className="text-sm text-gray-500">pending</span>
          </div>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Link>
  );
}

function QuickLinkCard({
  title,
  description,
  icon: Icon,
  href,
}: {
  title: string;
  description: string;
  icon: any;
  href: string;
}) {
  return (
    <Link
      to={href}
      className="block bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start">
        <div className="p-2 sm:p-3 bg-primary-100 rounded-lg">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
        </div>
        <div className="ml-3 sm:ml-4 flex-1">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </Link>
  );
}


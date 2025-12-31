import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/admin.service';
import { AlertStats, Alert, AdminAction, User } from '../types';
import {
  Users, Building2, FileText, AlertCircle, CheckCircle, XCircle,
  ShieldCheck, Clock, ArrowRight, TrendingUp, TrendingDown, Activity,
  BarChart3, PieChart, LineChart, Zap, History, UserPlus,
  PlusCircle, Edit, Trash2
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import {
  LineChart as RechartsLineChart,
  AreaChart,
  BarChart,
  PieChart as RechartsPieChart,
  Line,
  Area,
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface DashboardStats {
  alertStats: AlertStats | null;
  totalUsers: number;
  totalCompanies: number;
  totalPolicies: number;
  pendingKyc: number;
  pendingPolicyDocs: number;
  recentAlerts: Alert[];
  recentActions: AdminAction[];
  recentUsers: User[];
  trendData: any[];
  subscriptionStats: any[];
  companyStats: any[];
  documentStats: any[];
  alertDetectionStats: any[];
}

// Helper to aggregate data by date
const aggregateByDate = (items: any[], dateField: string, days: number = 7) => {
  const data: Record<string, number> = {};
  const today = new Date();

  // Initialize all days with 0
  for (let i = 0; i < days; i++) {
    const date = subDays(today, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    data[dateStr] = 0;
  }

  // Count items per day
  items.forEach(item => {
    if (item[dateField]) {
      const dateStr = format(new Date(item[dateField]), 'yyyy-MM-dd');
      if (data[dateStr] !== undefined) {
        data[dateStr]++;
      }
    }
  });

  return data;
};

const COLORS = {
  brand: '#06b6d4',
  cyan: '#22d3ee',
  sunset: '#fb923c',
  fire: '#f97316',
  yellow: '#eab308',
  success: '#10b981',
  danger: '#ef4444',
};

const CHART_COLORS = ['#06b6d4', '#22d3ee', '#fb923c', '#f97316', '#eab308', '#10b981', '#8b5cf6'];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    alertStats: null,
    totalUsers: 0,
    totalCompanies: 0,
    totalPolicies: 0,
    pendingKyc: 0,
    pendingPolicyDocs: 0,
    recentAlerts: [],
    recentActions: [],
    recentUsers: [],
    trendData: [],
    subscriptionStats: [],
    companyStats: [],
    documentStats: [],
    alertDetectionStats: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAllStats();
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadAllStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadAllStats = async () => {
    try {
      setLoading(true);
      setError('');

      const [
        alertStats,
        usersData,
        companiesData,
        policiesData,
        kycData,
        policyDocsData,
        recentAlertsData,
        actionsData,
        recentUsersData,
        trendUsersData,
        trendPoliciesData,
        trendAlertsData,
      ] = await Promise.all([
        adminService.getAlertStats().catch(() => null),
        adminService.getUsers(1, 1).catch(() => ({ data: [], pagination: { total: 0, page: 1, limit: 1, totalPages: 0 } })),
        adminService.getCompanies(1, 1).catch(() => ({ data: [], pagination: { total: 0, page: 1, limit: 1, totalPages: 0 } })),
        adminService.getPolicies(1, 1).catch(() => ({ data: [], pagination: { total: 0, page: 1, limit: 1, totalPages: 0 } })),
        adminService.getKycDocuments(1, 1, 'pending').catch(() => ({ data: [], pagination: { total: 0, page: 1, limit: 1, totalPages: 0 } })),
        adminService.getPolicyDocuments(1, 1, 'pending').catch(() => ({ data: [], pagination: { total: 0, page: 1, limit: 1, totalPages: 0 } })),
        adminService.getAlerts(1, 5, 'PENDING').catch(() => ({ data: [], pagination: { total: 0, page: 1, limit: 5, totalPages: 0 } })),
        adminService.getAdminActions(1, 5).catch(() => ({ data: [], pagination: { total: 0, page: 1, limit: 5, totalPages: 0 } })),
        adminService.getUsers(1, 5).catch(() => ({ data: [], pagination: { total: 0, page: 1, limit: 5, totalPages: 0 } })),
        // Fetch more data for trends (last 100 items)
        adminService.getUsers(1, 100).catch(() => ({ data: [], pagination: { total: 0, page: 1, limit: 100, totalPages: 0 } })),
        adminService.getPolicies(1, 100).catch(() => ({ data: [], pagination: { total: 0, page: 1, limit: 100, totalPages: 0 } })),
        adminService.getAlerts(1, 100).catch(() => ({ data: [], pagination: { total: 0, page: 1, limit: 100, totalPages: 0 } })),
      ]);

      // Calculate trends
      const days = 7;
      const userTrends = aggregateByDate(trendUsersData?.data || [], 'createdAt', days);
      const policyTrends = aggregateByDate(trendPoliciesData?.data || [], 'uploadedAt', days);
      const alertTrends = aggregateByDate(trendAlertsData?.data || [], 'createdAt', days);

      const trendData = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        trendData.push({
          date: format(date, 'MMM dd'),
          fullDate: dateStr,
          users: userTrends[dateStr] || 0,
          policies: policyTrends[dateStr] || 0,
          alerts: alertTrends[dateStr] || 0,
        });
      }

      // Calculate Subscription Stats
      const subStats = { ACTIVE: 0, INACTIVE: 0, EXPIRED: 0 };
      (trendUsersData?.data || []).forEach((user: User) => {
        if (user.subscriptionStatus && subStats[user.subscriptionStatus] !== undefined) {
          subStats[user.subscriptionStatus]++;
        }
      });
      const subscriptionStats = Object.entries(subStats).map(([name, value]) => ({
        name,
        value,
        color: name === 'ACTIVE' ? COLORS.success : name === 'INACTIVE' ? COLORS.yellow : COLORS.danger
      })).filter(item => item.value > 0);

      // Calculate Company Stats
      const compStats: Record<string, number> = {};
      (trendPoliciesData?.data || []).forEach((policy: any) => {
        const companyName = policy.insuranceCompany?.name || 'Unknown';
        compStats[companyName] = (compStats[companyName] || 0) + 1;
      });
      const companyStats = Object.entries(compStats)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5 companies

      // Calculate Document Stats
      let verifiedDocs = 0;
      let pendingDocs = 0;

      // Check KYC docs
      (kycData?.data || []).forEach((user: any) => {
        user.documents.forEach((doc: any) => {
          if (doc.isVerified) verifiedDocs++;
          else pendingDocs++;
        });
      });

      // Check Policy docs
      (policyDocsData?.data || []).forEach((policy: any) => {
        policy.documents.forEach((doc: any) => {
          if (doc.isVerified) verifiedDocs++;
          else pendingDocs++;
        });
      });

      const documentStats = [
        { name: 'Verified', value: verifiedDocs, color: COLORS.success },
        { name: 'Pending', value: pendingDocs, color: COLORS.yellow },
      ];

      // Calculate Alert Detection Stats
      const alertDetectionStats = [
        { name: 'SMS', value: alertStats?.smsAlerts || 0, color: COLORS.brand },
        { name: 'Manual', value: alertStats?.manualAlerts || 0, color: COLORS.fire },
      ].filter(item => item.value > 0);

      setStats({
        alertStats,
        totalUsers: usersData.pagination.total,
        totalCompanies: companiesData.pagination.total,
        totalPolicies: policiesData.pagination.total,
        pendingKyc: kycData.pagination.total,
        pendingPolicyDocs: policyDocsData.pagination.total,
        recentAlerts: recentAlertsData.data || [],
        recentActions: actionsData?.data || [],
        recentUsers: recentUsersData?.data || [],
        trendData,
        subscriptionStats,
        companyStats,
        documentStats,
        alertDetectionStats,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  // Generate trend data based on current stats
  const trendData = stats.trendData;

  // Alert status distribution for pie chart
  const alertDistribution = useMemo(() => {
    if (!stats.alertStats) return [];
    return [
      { name: 'Verified', value: stats.alertStats.verified, color: COLORS.success },
      { name: 'Pending', value: stats.alertStats.pending, color: COLORS.yellow },
      { name: 'False Alerts', value: stats.alertStats.falseAlerts, color: COLORS.danger },
    ].filter(item => item.value > 0);
  }, [stats.alertStats]);

  // Alert type distribution
  const alertTypeData = useMemo(() => {
    if (!stats.alertStats?.typeStats) return [];
    return Object.entries(stats.alertStats.typeStats)
      .map(([name, value]) => ({ name: name.replace('_', ' '), value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [stats.alertStats]);

  // Calculate growth percentages (mock for now)
  const growthMetrics = useMemo(() => {
    const calculateGrowth = (current: number): { value: string; isPositive: boolean } => {
      if (current === 0) return { value: '0.0', isPositive: true };
      const growth = Math.random() * 20 - 5; // Random between -5% and 15%
      return {
        value: Math.abs(growth).toFixed(1),
        isPositive: growth >= 0,
      };
    };

    return {
      users: calculateGrowth(stats.totalUsers),
      policies: calculateGrowth(stats.totalPolicies),
      alerts: calculateGrowth(stats.alertStats?.total || 0),
    };
  }, [stats]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-200 dark:border-cyan-900 border-t-brand-500 dark:border-t-cyan-400"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-brand opacity-20 blur-xl animate-pulse-glow"></div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 border-2 border-orange-400 dark:border-orange-500 text-orange-700 dark:text-orange-400 px-6 py-4 rounded-xl shadow-glow-orange">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 animate-pulse" />
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-brand mb-1 sm:mb-2">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 animate-pulse" />
            <span>Live</span>
          </div>
          <button
            onClick={loadAllStats}
            className="btn-cyan flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm px-3 sm:px-6 py-2 sm:py-3"
          >
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Overview Statistics with Growth Indicators */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <div className="w-1 h-6 bg-gradient-brand rounded-full mr-3"></div>
          Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            gradient="brand"
            href="/users"
            growth={growthMetrics.users}
          />
          <StatCard
            title="Companies"
            value={stats.totalCompanies}
            icon={Building2}
            gradient="cyan"
            href="/companies"
          />
          <StatCard
            title="Total Policies"
            value={stats.totalPolicies}
            icon={FileText}
            gradient="sunset"
            href="/policies"
            growth={growthMetrics.policies}
          />
          <StatCard
            title="Total Alerts"
            value={stats.alertStats?.total || 0}
            icon={AlertCircle}
            gradient="fire"
            href="/alerts"
            growth={growthMetrics.alerts}
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Growth Trends - Area Chart */}
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-brand-500 to-cyan-400 rounded-lg">
                <LineChart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Growth Trends</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Last 7 days</p>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.brand} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLORS.brand} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPolicies" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.sunset} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLORS.sunset} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.fire} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLORS.fire} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="date"
                className="text-xs"
                stroke="currentColor"
                style={{ fill: 'currentColor' }}
              />
              <YAxis
                className="text-xs"
                stroke="currentColor"
                style={{ fill: 'currentColor' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--tw-color-gray-800)',
                  border: '1px solid var(--tw-color-gray-700)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'var(--tw-color-white)' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="users"
                stroke={COLORS.brand}
                fillOpacity={1}
                fill="url(#colorUsers)"
                name="Users"
              />
              <Area
                type="monotone"
                dataKey="policies"
                stroke={COLORS.sunset}
                fillOpacity={1}
                fill="url(#colorPolicies)"
                name="Policies"
              />
              <Area
                type="monotone"
                dataKey="alerts"
                stroke={COLORS.fire}
                fillOpacity={1}
                fill="url(#colorAlerts)"
                name="Alerts"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Alert Status Distribution - Pie Chart */}
        {alertDistribution.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-sunset-400 to-yellow-400 rounded-lg">
                  <PieChart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Alert Status</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Distribution</p>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={alertDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {alertDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Activity Over Time - Line Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-400 to-brand-500 rounded-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Activity Over Time</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Daily activity</p>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsLineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="date"
                className="text-xs"
                stroke="currentColor"
                style={{ fill: 'currentColor' }}
              />
              <YAxis
                className="text-xs"
                stroke="currentColor"
                style={{ fill: 'currentColor' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--tw-color-gray-800)',
                  border: '1px solid var(--tw-color-gray-700)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'var(--tw-color-white)' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="users"
                stroke={COLORS.brand}
                strokeWidth={2}
                dot={{ fill: COLORS.brand, r: 4 }}
                name="Users"
              />
              <Line
                type="monotone"
                dataKey="policies"
                stroke={COLORS.sunset}
                strokeWidth={2}
                dot={{ fill: COLORS.sunset, r: 4 }}
                name="Policies"
              />
              <Line
                type="monotone"
                dataKey="alerts"
                stroke={COLORS.fire}
                strokeWidth={2}
                dot={{ fill: COLORS.fire, r: 4 }}
                name="Alerts"
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>

        {/* Alert Types - Bar Chart */}
        {alertTypeData.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-fire-500 to-orange-600 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Alert Types</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">By category</p>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={alertTypeData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="name"
                  className="text-xs"
                  stroke="currentColor"
                  style={{ fill: 'currentColor' }}
                />
                <YAxis
                  className="text-xs"
                  stroke="currentColor"
                  style={{ fill: 'currentColor' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tw-color-gray-800)',
                    border: '1px solid var(--tw-color-gray-700)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'var(--tw-color-white)' }}
                />
                <Bar dataKey="value" fill={COLORS.fire} radius={[8, 8, 0, 0]}>
                  {alertTypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Subscription Distribution - Pie Chart */}
        {stats.subscriptionStats.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Subscriptions</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">User status</p>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={stats.subscriptionStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.subscriptionStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Policies by Company - Bar Chart */}
        {stats.companyStats.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Top Companies</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">By policy count</p>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.companyStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" className="text-xs" stroke="currentColor" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  className="text-xs"
                  stroke="currentColor"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tw-color-gray-800)',
                    border: '1px solid var(--tw-color-gray-700)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'var(--tw-color-white)' }}
                />
                <Bar dataKey="value" fill={COLORS.cyan} radius={[0, 8, 8, 0]}>
                  {stats.companyStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Document Verification Status - Donut Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Documents</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Verification status</p>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsPieChart>
              <Pie
                data={stats.documentStats}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {stats.documentStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Alert Detection Method - Pie Chart (8th Graph) */}
        {stats.alertDetectionStats.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Detection Method</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">SMS vs Manual</p>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={stats.alertDetectionStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.alertDetectionStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Alert Statistics */}
      {stats.alertStats && (
        <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
            <div className="w-1 h-6 bg-gradient-sunset rounded-full mr-3"></div>
            Alert Statistics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <StatCard
              title="Pending Alerts"
              value={stats.alertStats.pending}
              icon={AlertCircle}
              gradient="yellow"
              href="/alerts?status=PENDING"
            />
            <StatCard
              title="Verified Alerts"
              value={stats.alertStats.verified}
              icon={CheckCircle}
              gradient="cyan"
              href="/alerts?status=VERIFIED"
            />
            <StatCard
              title="False Alerts"
              value={stats.alertStats.falseAlerts}
              icon={XCircle}
              gradient="fire"
              href="/alerts?status=FALSE_ALERT"
            />
            <StatCard
              title="SMS Alerts"
              value={stats.alertStats.smsAlerts || 0}
              icon={AlertCircle}
              gradient="brand"
            />
          </div>
        </div>
      )}

      {/* Pending Reviews */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <div className="w-1 h-6 bg-gradient-glow rounded-full mr-3"></div>
          Pending Reviews
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          <ReviewCard
            title="KYC Documents"
            count={stats.pendingKyc}
            icon={ShieldCheck}
            href="/kyc-review"
            gradient="yellow"
            description="Documents awaiting verification"
          />
          <ReviewCard
            title="Policy Documents"
            count={stats.pendingPolicyDocs}
            icon={FileText}
            href="/policy-review"
            gradient="sunset"
            description="Policy documents pending review"
          />
        </div>
      </div>

      {/* Recent Alerts */}
      {stats.recentAlerts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <div className="w-1 h-6 bg-gradient-fire rounded-full mr-3"></div>
              Recent Pending Alerts
            </h2>
            <Link
              to="/alerts"
              className="text-sm text-brand-600 dark:text-cyan-400 hover:text-brand-700 dark:hover:text-cyan-300 font-semibold flex items-center space-x-1 transition-colors group"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="card elevated overflow-hidden border border-yellow-400/20 dark:border-yellow-500/20">
            <div className="divide-y divide-gray-200 dark:divide-navy-700">
              {stats.recentAlerts.map((alert) => (
                <Link
                  key={alert.id}
                  to="/alerts"
                  className="block p-4 hover:bg-yellow-50 dark:hover:bg-yellow-950/10 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="p-1.5 bg-gradient-sunset rounded-lg shadow-glow-orange">
                          <AlertCircle className="w-3.5 h-3.5 text-white" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {alert.user?.name || 'Unknown User'}
                        </p>
                        <span className="badge badge-yellow">
                          {alert.alertType || 'ALERT'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 ml-7">
                        {alert.user?.email || 'No email'} • {alert.user?.mobileNumber || 'No phone'}
                      </p>
                      {alert.remarks && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 ml-7 truncate">{alert.remarks}</p>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0 text-right">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {format(new Date(alert.createdAt), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
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

      {/* Recent Activity & New Users Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Admin Actions */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                <History className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Actions</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Latest admin activities</p>
              </div>
            </div>
            <Link
              to="/audit-logs"
              className="text-sm text-brand-600 dark:text-cyan-400 hover:text-brand-700 dark:hover:text-cyan-300 font-medium"
            >
              View All
            </Link>
          </div>

          <div className="space-y-4">
            {stats.recentActions.length > 0 ? (
              stats.recentActions.map((action) => (
                <div key={action.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-navy-800/50 transition-colors">
                  <div className={`mt-1 p-1.5 rounded-full ${action.actionType.includes('DELETE') ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                    action.actionType.includes('UPDATE') ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                      action.actionType.includes('CREATE') ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                    {action.actionType.includes('DELETE') ? <Trash2 className="w-3 h-3" /> :
                      action.actionType.includes('UPDATE') ? <Edit className="w-3 h-3" /> :
                        action.actionType.includes('CREATE') ? <PlusCircle className="w-3 h-3" /> :
                          <Activity className="w-3 h-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {action.actionType.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      by {action.admin?.name || 'System'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {format(new Date(action.createdAt), 'MMM dd, HH:mm')}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No recent actions found
              </div>
            )}
          </div>
        </div>

        {/* New Users */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">New Users</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Recently registered</p>
              </div>
            </div>
            <Link
              to="/users"
              className="text-sm text-brand-600 dark:text-cyan-400 hover:text-brand-700 dark:hover:text-cyan-300 font-medium"
            >
              View All
            </Link>
          </div>

          <div className="space-y-4">
            {stats.recentUsers.length > 0 ? (
              stats.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-navy-800/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-cyan-300 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${user.subscriptionStatus === 'ACTIVE'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                      {user.subscriptionStatus}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(user.createdAt), 'MMM dd')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No new users found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <div className="w-1 h-6 bg-gradient-ocean rounded-full mr-3"></div>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <QuickLinkCard
            title="Users"
            description="Manage user accounts and subscriptions"
            icon={Users}
            href="/users"
            gradient="brand"
          />
          <QuickLinkCard
            title="KYC Review"
            description="Review and verify user documents"
            icon={ShieldCheck}
            href="/kyc-review"
            gradient="yellow"
          />
          <QuickLinkCard
            title="Policy Review"
            description="Review and verify policy documents"
            icon={FileText}
            href="/policy-review"
            gradient="sunset"
          />
          <QuickLinkCard
            title="Companies"
            description="Manage insurance companies"
            icon={Building2}
            href="/companies"
            gradient="cyan"
          />
          <QuickLinkCard
            title="Policies"
            description="View and manage policies"
            icon={FileText}
            href="/policies"
            gradient="glow"
          />
          <QuickLinkCard
            title="Alerts"
            description="View and manage alerts"
            icon={AlertCircle}
            href="/alerts"
            gradient="fire"
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
  gradient,
  href,
  growth,
}: {
  title: string;
  value: number;
  icon: any;
  gradient: 'brand' | 'cyan' | 'sunset' | 'fire' | 'yellow';
  href?: string;
  growth?: { value: string; isPositive: boolean };
}) {
  const gradientClasses = {
    brand: 'from-brand-500 to-cyan-400',
    cyan: 'from-cyan-400 to-brand-500',
    sunset: 'from-orange-400 to-yellow-400',
    fire: 'from-orange-500 to-orange-600',
    yellow: 'from-yellow-400 to-yellow-500',
  };

  const glowClasses = {
    brand: 'shadow-glow-brand',
    cyan: 'shadow-glow-cyan',
    sunset: 'shadow-glow-orange',
    fire: 'shadow-glow-orange',
    yellow: 'shadow-glow-yellow',
  };

  const content = (
    <div className="card card-hover p-4 sm:p-5 lg:p-6 border border-transparent hover:border-opacity-50 group relative overflow-hidden">
      {/* Background gradient effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClasses[gradient]} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

      <div className="relative">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 truncate">{title}</p>
          {growth && (
            <div className={`flex items-center gap-1 text-xs font-semibold flex-shrink-0 ${growth.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
              {growth.isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{growth.value}%</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
          <div className={`relative p-2.5 sm:p-3 lg:p-4 bg-gradient-to-br ${gradientClasses[gradient]} rounded-lg sm:rounded-xl ${glowClasses[gradient]} group-hover:scale-110 transition-all duration-300 flex-shrink-0`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300"></div>
          </div>
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
  gradient,
  description,
}: {
  title: string;
  count: number;
  icon: any;
  href: string;
  gradient: 'yellow' | 'sunset';
  description: string;
}) {
  const gradientClasses = {
    yellow: 'from-yellow-400 to-yellow-500',
    sunset: 'from-orange-400 to-yellow-400',
  };

  const borderClasses = {
    yellow: 'border-yellow-400/30 hover:border-yellow-400',
    sunset: 'border-orange-400/30 hover:border-orange-400',
  };

  const glowClasses = {
    yellow: 'hover:shadow-glow-yellow-lg',
    sunset: 'hover:shadow-glow-orange-lg',
  };

  return (
    <Link
      to={href}
      className={`block card p-4 sm:p-5 lg:p-6 border-2 ${borderClasses[gradient]} ${glowClasses[gradient]} transition-all duration-300 hover:-translate-y-2 group relative overflow-hidden`}
    >
      {/* Decorative left bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${gradientClasses[gradient]} transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top`}></div>

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
            <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 dark:text-white truncate">{title}</h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">{description}</p>
          <div className="flex items-center space-x-2 flex-wrap">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-ocean">{count.toLocaleString()}</span>
            <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">pending</span>
          </div>
        </div>
        <div className={`relative p-2.5 sm:p-3 lg:p-4 bg-gradient-to-br ${gradientClasses[gradient]} rounded-lg sm:rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 flex-shrink-0`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
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
  gradient,
}: {
  title: string;
  description: string;
  icon: any;
  href: string;
  gradient: 'brand' | 'cyan' | 'sunset' | 'yellow' | 'fire' | 'glow';
}) {
  const gradientClasses = {
    brand: 'from-brand-500 to-cyan-400',
    cyan: 'from-cyan-400 to-brand-500',
    sunset: 'from-orange-400 to-yellow-400',
    fire: 'from-orange-500 to-orange-600',
    yellow: 'from-yellow-400 to-yellow-500',
    glow: 'from-cyan-400 to-brand-600',
  };

  return (
    <Link
      to={href}
      className="block card card-hover p-5 sm:p-6 group relative overflow-hidden border border-transparent hover:border-cyan-400/30"
    >
      <div className="relative flex items-start space-x-4">
        <div className={`relative p-3 bg-gradient-to-br ${gradientClasses[gradient]} rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300"></div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-gradient-brand transition-all">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-500 dark:group-hover:text-cyan-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
      </div>
    </Link>
  );
}

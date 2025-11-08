import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/admin.service';
import { AlertStats } from '../types';
import { Users, Building2, FileText, Bell, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAlertStats();
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load statistics');
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
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Alerts"
          value={stats?.total || 0}
          icon={Bell}
          color="blue"
        />
        <StatCard
          title="Pending"
          value={stats?.pending || 0}
          icon={AlertCircle}
          color="yellow"
        />
        <StatCard
          title="Verified"
          value={stats?.verified || 0}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="False Alerts"
          value={stats?.falseAlerts || 0}
          icon={XCircle}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickLinkCard
          title="Users"
          description="Manage user accounts and subscriptions"
          icon={Users}
          href="/users"
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
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: any;
  color: 'blue' | 'yellow' | 'green' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
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
      className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start">
        <div className="p-3 bg-primary-100 rounded-lg">
          <Icon className="w-6 h-6 text-primary-600" />
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </Link>
  );
}


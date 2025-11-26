import { useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';
import { Company, PaginatedResponse } from '../types';
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight, Building2, Search, Sparkles } from 'lucide-react';

export default function Companies() {
  const [companies, setCompanies] = useState<PaginatedResponse<Company> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const limit = 25;

  const [formData, setFormData] = useState({
    name: '',
    contactEmail: '',
    contactNumber: '',
    websiteUrl: '',
    address: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  useEffect(() => {
    loadCompanies();
  }, [page, statusFilter, searchQuery]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getCompanies(page, limit, statusFilter, searchQuery);
      if (data && data.data && Array.isArray(data.data)) {
        setCompanies(data);
      } else {
        setCompanies({ data: [], pagination: { page: 1, limit: 25, total: 0, totalPages: 0 } });
        setError('Invalid response format from server');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load companies');
      setCompanies({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCompany(null);
    setFormData({
      name: '',
      contactEmail: '',
      contactNumber: '',
      websiteUrl: '',
      address: '',
      status: 'ACTIVE',
    });
    setShowModal(true);
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      contactEmail: company.contactEmail,
      contactNumber: company.contactNumber,
      websiteUrl: company.websiteUrl || '',
      address: company.address || '',
      status: company.status,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        await adminService.updateCompany(editingCompany.id, formData);
      } else {
        await adminService.createCompany(formData);
      }
      setShowModal(false);
      loadCompanies();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save company');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this company?')) return;
    try {
      await adminService.deleteCompany(id);
      loadCompanies();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete company');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-sunset rounded-xl blur-lg opacity-60 animate-pulse-glow-orange"></div>
            <div className="relative p-3 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl shadow-glow-orange">
              <Building2 className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gradient-sunset">Companies</h1>
            {companies && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span><strong>{companies.pagination.total}</strong> {companies.pagination.total === 1 ? 'company' : 'companies'} total</span>
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="btn-orange flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Company</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-500 dark:text-orange-400 w-5 h-5 z-10" />
          <input
            type="text"
            placeholder="Search companies by name, email, or contact..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-12 pr-4 py-3.5 border-2 border-orange-400/30 dark:border-orange-500/30 rounded-xl bg-white dark:bg-navy-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-500 focus:border-orange-400 dark:focus:border-orange-500 transition-all duration-300 shadow-md hover:shadow-glow-orange placeholder:text-gray-400"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setStatusFilter(undefined)}
            className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${statusFilter === undefined
              ? 'bg-gradient-sunset text-white shadow-glow-orange'
              : 'bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-700 hover:border-orange-400 dark:hover:border-orange-500'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${statusFilter === 'ACTIVE'
              ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-white shadow-glow-cyan'
              : 'bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-700 hover:border-cyan-400 dark:hover:border-cyan-500'
              }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('INACTIVE')}
            className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${statusFilter === 'INACTIVE'
              ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md'
              : 'bg-white dark:bg-navy-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-700 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 border-l-4 border-orange-500 text-orange-700 dark:text-orange-400 px-5 py-4 rounded-r-xl shadow-glow-orange">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 dark:border-orange-900 border-t-orange-500 dark:border-t-orange-400"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-sunset opacity-20 blur-xl animate-pulse-glow-orange"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">Loading companies...</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block card elevated overflow-hidden border border-orange-400/20">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-navy-700">
              <thead className="bg-gradient-to-r from-navy-900 via-orange-900/50 to-navy-900 dark:from-navy-950 dark:via-orange-950/50 dark:to-navy-950">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-orange-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-navy-900 divide-y divide-gray-200 dark:divide-navy-700">
                {companies?.data && companies.data.length > 0 ? (
                  companies.data.map((company) => (
                    <tr key={company.id} className="hover:bg-orange-50 dark:hover:bg-orange-950/10 transition-all duration-200 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-sunset rounded-lg shadow-glow-orange group-hover:scale-110 transition-transform duration-200">
                            <Building2 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">{company.name}</div>
                            {company.websiteUrl && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{company.websiteUrl}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{company.contactEmail}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{company.contactNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={company.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}>
                          {company.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleEdit(company)}
                            className="flex items-center px-3 py-2 text-sm font-medium text-brand-600 dark:text-cyan-400 hover:bg-brand-50 dark:hover:bg-navy-800 rounded-lg transition-all border border-transparent hover:border-brand-200 dark:hover:border-navy-600"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(company.id)}
                            className="flex items-center px-3 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-navy-800 rounded-lg transition-all border border-transparent hover:border-orange-200 dark:hover:border-navy-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-navy-800 dark:to-navy-900 rounded-2xl">
                          <Building2 className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">No companies found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {companies && companies.pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 card p-4 sm:p-5 border border-orange-400/20">
              <div className="text-sm text-gray-700 dark:text-gray-300 text-center sm:text-left">
                Showing <span className="font-bold text-orange-500 dark:text-orange-400">{((page - 1) * limit) + 1}</span> to{' '}
                <span className="font-bold text-orange-500 dark:text-orange-400">{Math.min(page * limit, companies.pagination.total)}</span> of{' '}
                <span className="font-bold text-orange-500 dark:text-orange-400">{companies.pagination.total}</span> results
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
                  disabled={page >= companies.pagination.totalPages}
                  className="px-4 py-2.5 border-2 border-orange-400 dark:border-orange-500 text-orange-500 dark:text-orange-400 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gradient-sunset hover:text-white hover:border-transparent transition-all font-semibold disabled:hover:bg-transparent disabled:hover:text-orange-500 dark:disabled:hover:text-orange-400 hover:scale-105"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {companies?.data && companies.data.length > 0 ? (
              companies.data.map((company) => (
                <div key={company.id} className="card p-5 border border-orange-400/20 hover:border-orange-400 hover:shadow-glow-orange transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="p-2 bg-gradient-sunset rounded-lg shadow-glow-orange">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{company.name}</div>
                        {company.websiteUrl && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">{company.websiteUrl}</div>
                        )}
                      </div>
                    </div>
                    <span className={`${company.status === 'ACTIVE' ? 'status-active' : 'status-inactive'} flex-shrink-0 ml-2`}>
                      {company.status}
                    </span>
                  </div>
                  <div className="text-xs space-y-1 pt-3 border-t border-gray-200 dark:border-navy-700 text-gray-700 dark:text-gray-300">
                    <div>{company.contactEmail}</div>
                    <div>{company.contactNumber}</div>
                  </div>
                  <div className="flex items-center justify-end space-x-2 mt-3 pt-3 border-t border-gray-200 dark:border-navy-700">
                    <button
                      onClick={() => handleEdit(company)}
                      className="p-2 text-brand-600 dark:text-cyan-400 hover:bg-gradient-brand hover:text-white rounded-lg transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(company.id)}
                      className="p-2 text-orange-600 dark:text-orange-400 hover:bg-gradient-sunset hover:text-white rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="card p-8 text-center border border-orange-400/20">
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-navy-800 dark:to-navy-900 rounded-2xl">
                    <Building2 className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">No companies found</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm overflow-y-auto h-full w-full z-50 p-4 flex items-center justify-center">
          <div className="relative card border-2 border-orange-400/30 dark:border-orange-500/30 w-full max-w-md shadow-2xl shadow-orange-500/20">
            <h3 className="text-xl font-bold text-gradient-sunset mb-4">
              {editingCompany ? 'Edit Company' : 'Create Company'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-elegant w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Contact Email</label>
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="input-elegant w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Contact Number</label>
                <input
                  type="text"
                  required
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  className="input-elegant w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Website URL</label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  className="input-elegant w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-elegant w-full"
                  rows={3}
                />
              </div>
              {editingCompany && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                    className="input-elegant w-full"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              )}
              <div className="flex space-x-3">
                <button type="submit" className="flex-1 btn-orange">
                  {editingCompany ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

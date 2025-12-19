import { useEffect, useState } from 'react';
import { adminService } from '../services/admin.service';
import { Plus, Edit, Trash2, Star } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  features: string[];
  isPopular: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [featureInput, setFeatureInput] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    features: [] as string[],
    isPopular: false,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getSubscriptionPlans();
      setPlans(data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load subscription plans');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      price: '',
      features: [],
      isPopular: false,
      status: 'ACTIVE',
    });
    setFeatureInput('');
    setShowModal(true);
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      features: [...plan.features],
      isPopular: plan.isPopular,
      status: plan.status,
    });
    setFeatureInput('');
    setShowModal(true);
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, featureInput.trim()],
      });
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.name || !formData.price || formData.features.length === 0) {
        alert('Please fill in all required fields');
        return;
      }

      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        alert('Price must be a positive number');
        return;
      }

      if (editingPlan) {
        await adminService.updateSubscriptionPlan(editingPlan.id, {
          name: formData.name,
          price,
          features: formData.features,
          isPopular: formData.isPopular,
          status: formData.status,
        });
      } else {
        await adminService.createSubscriptionPlan({
          name: formData.name,
          price,
          features: formData.features,
          isPopular: formData.isPopular,
          status: formData.status,
        });
      }
      setShowModal(false);
      loadPlans();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save subscription plan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscription plan?')) return;
    try {
      await adminService.deleteSubscriptionPlan(id);
      loadPlans();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete subscription plan');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subscription Plans</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage subscription plan prices and features</p>
        </div>
        <button onClick={handleCreate} className="btn-brand flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Plan
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-200 dark:border-brand-900 border-t-cyan-500 dark:border-t-cyan-400"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-brand opacity-20 blur-xl animate-pulse-glow"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">Loading plans...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`card p-6 relative border-2 ${
                plan.isPopular ? 'border-orange-400/50 shadow-glow-orange' : 'border-cyan-400/30'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-4 right-4">
                  <Star className="w-5 h-5 text-orange-400 fill-orange-400" />
                </div>
              )}
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">₹{plan.price}</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">/year</span>
                </div>
                <span
                  className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                    plan.status === 'ACTIVE'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                  }`}
                >
                  {plan.status}
                </span>
              </div>
              <ul className="space-y-2 mb-4 min-h-[120px]">
                {plan.features.map((feature, index) => (
                  <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                    <span className="text-cyan-400 mr-2">•</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEdit(plan)}
                  className="flex-1 btn-outline flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="btn-outline text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                    disabled={!!editingPlan}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price (Rs.) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Features *
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                      className="input flex-1"
                      placeholder="Add a feature"
                    />
                    <button type="button" onClick={handleAddFeature} className="btn-outline">
                      Add
                    </button>
                  </div>
                  <ul className="space-y-1 min-h-[80px] max-h-[150px] overflow-y-auto border border-gray-300 dark:border-gray-600 rounded p-2">
                    {formData.features.length === 0 ? (
                      <li className="text-sm text-gray-500 dark:text-gray-400 italic">No features added</li>
                    ) : (
                      formData.features.map((feature, index) => (
                        <li key={index} className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                          <span>• {feature}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(index)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          >
                            Remove
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPopular}
                      onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                      className="checkbox"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mark as Popular</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                      className="input"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-brand flex-1">
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-outline flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

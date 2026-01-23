import { useEffect, useState } from 'react';
import { bannerService, Banner } from '../services/banner.service';
import { Plus, Edit, Trash2, Image as ImageIcon, CheckCircle, Upload, Sparkles } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function BannerManagement() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    file: null as File | null,
  });

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await bannerService.getAllBanners();
      setBanners(data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load banners');
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      file: null,
    });
    setShowModal(true);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      file: null,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner && !formData.file) {
      alert('Please select an image file');
      return;
    }

    try {
      setUploading(true);
      if (editingBanner) {
        // Update existing banner
        await bannerService.updateBanner(editingBanner.id, {
          title: formData.title || undefined,
        });
      } else {
        // Upload new banner
        if (!formData.file) {
          alert('Please select an image file');
          return;
        }
        await bannerService.uploadBanner(formData.file, formData.title || undefined);
      }
      setShowModal(false);
      loadBanners();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save banner');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      await bannerService.deleteBanner(id);
      loadBanners();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete banner');
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await bannerService.updateBanner(id, { isActive: true });
      loadBanners();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to set banner as active');
    }
  };

  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${API_BASE_URL}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-brand rounded-xl blur-lg opacity-60 animate-pulse-glow"></div>
            <div className="relative p-3 bg-gradient-to-br from-brand-500 to-cyan-400 rounded-xl shadow-glow">
              <ImageIcon className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gradient-brand">Banner Management</h1>
            {banners && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-brand-500" />
                <span><strong>{banners.length}</strong> {banners.length === 1 ? 'banner' : 'banners'} total</span>
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="btn-brand flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Upload Banner</span>
        </button>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-brand-50 to-cyan-50 dark:from-brand-950/30 dark:to-cyan-950/30 border-l-4 border-brand-500 text-brand-700 dark:text-brand-400 px-5 py-4 rounded-r-xl shadow-glow">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-200 dark:border-brand-900 border-t-brand-500 dark:border-t-cyan-400"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-brand opacity-20 blur-xl animate-pulse-glow"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">Loading banners...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.length > 0 ? (
            banners.map((banner) => (
              <div
                key={banner.id}
                className={`card p-0 overflow-hidden border-2 transition-all duration-300 ${
                  banner.isActive
                    ? 'border-brand-400 dark:border-cyan-400 shadow-glow'
                    : 'border-gray-300 dark:border-navy-700 hover:border-brand-300 dark:hover:border-cyan-500'
                }`}
              >
                {/* Banner Image */}
                <div className="relative w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-navy-800 dark:to-navy-900 overflow-hidden">
                  {banner.imageUrl ? (
                    <img
                      src={getImageUrl(banner.imageUrl)}
                      alt={banner.title || 'Banner'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                    </div>
                  )}
                  {banner.isActive && (
                    <div className="absolute top-2 right-2 bg-gradient-brand text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 shadow-lg">
                      <CheckCircle className="w-4 h-4" />
                      <span>Active</span>
                    </div>
                  )}
                </div>

                {/* Banner Info */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {banner.title || 'Untitled Banner'}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                    Created: {new Date(banner.createdAt).toLocaleDateString()}
                  </p>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {!banner.isActive && (
                      <button
                        onClick={() => handleSetActive(banner.id)}
                        className="flex-1 btn-brand text-xs py-2 flex items-center justify-center space-x-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Set Active</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(banner)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-brand-600 dark:text-cyan-400 hover:bg-brand-50 dark:hover:bg-navy-800 rounded-lg transition-all border border-transparent hover:border-brand-200 dark:hover:border-navy-600 flex items-center justify-center space-x-1"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="px-3 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-navy-800 rounded-lg transition-all border border-transparent hover:border-orange-200 dark:hover:border-navy-600 flex items-center justify-center space-x-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full card p-8 text-center border border-brand-400/20">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-navy-800 dark:to-navy-900 rounded-2xl">
                  <ImageIcon className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">No banners found</p>
                <button onClick={handleCreate} className="btn-brand mt-4">
                  Upload Your First Banner
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overflow-x-hidden modal-container">
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm modal-backdrop"></div>
          <div className="relative z-50 card border-2 border-brand-400/30 dark:border-cyan-500/30 w-full max-w-md sm:max-w-lg md:max-w-xl shadow-2xl shadow-brand-500/20 m-3 sm:m-4 md:m-6 mt-4 sm:mt-6 md:mt-8 mb-4 sm:mb-8 p-4 sm:p-5 md:p-6 lg:p-8 modal-content-zoom-safe">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gradient-brand mb-4 sm:mb-5 md:mb-6 text-zoom-safe truncate min-w-0">
              {editingBanner ? 'Edit Banner' : 'Upload Banner'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-5 w-full min-w-0 max-w-full">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter banner title"
                  className="input-elegant w-full text-sm sm:text-base"
                />
              </div>
              {!editingBanner && (
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Banner Image
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      required={!editingBanner}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFormData({ ...formData, file });
                        }
                      }}
                      className="hidden"
                      id="banner-upload"
                    />
                    <label
                      htmlFor="banner-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-brand-400 dark:border-cyan-500 rounded-lg cursor-pointer hover:bg-brand-50 dark:hover:bg-navy-800 transition-all"
                    >
                      {formData.file ? (
                        <div className="text-center p-4">
                          <CheckCircle className="w-8 h-8 text-brand-500 dark:text-cyan-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{formData.file.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div className="text-center p-4">
                          <Upload className="w-8 h-8 text-brand-500 dark:text-cyan-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            PNG, JPG, WEBP up to 10MB
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}
              {editingBanner && (
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Current Image
                  </label>
                  <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-navy-800 dark:to-navy-900 rounded-lg overflow-hidden">
                    <img
                      src={getImageUrl(editingBanner.imageUrl)}
                      alt={editingBanner.title || 'Banner'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-3">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 btn-brand text-sm sm:text-base py-2.5 sm:py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : editingBanner ? 'Update' : 'Upload'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={uploading}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 sm:py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-semibold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
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

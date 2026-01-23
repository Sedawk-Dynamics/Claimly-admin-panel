import api from './api';

export interface Banner {
  id: string;
  title: string | null;
  imageUrl: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const bannerService = {
  async getAllBanners(): Promise<Banner[]> {
    const response = await api.get<{ success: boolean; data: Banner[] }>('/banners');
    return response.data.data;
  },

  async getBannerById(id: string): Promise<Banner> {
    const response = await api.get<{ success: boolean; data: Banner }>(`/banners/${id}`);
    return response.data.data;
  },

  async uploadBanner(file: File, title?: string): Promise<Banner> {
    const formData = new FormData();
    formData.append('file', file);
    if (title) {
      formData.append('title', title);
    }
    const response = await api.post<{ success: boolean; data: Banner }>('/banners', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async updateBanner(id: string, data: { title?: string; isActive?: boolean }): Promise<Banner> {
    const response = await api.put<{ success: boolean; data: Banner }>(`/banners/${id}`, data);
    return response.data.data;
  },

  async deleteBanner(id: string): Promise<void> {
    await api.delete(`/banners/${id}`);
  },
};

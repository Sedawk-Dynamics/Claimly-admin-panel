import api from './api';

export interface OfferBanner {
  id: string;
  title: string | null;
  imageUrl: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const offerBannerService = {
  async getAllOfferBanners(): Promise<OfferBanner[]> {
    const response = await api.get<{ success: boolean; data: OfferBanner[] }>('/offer-banners');
    return response.data.data;
  },

  async getOfferBannerById(id: string): Promise<OfferBanner> {
    const response = await api.get<{ success: boolean; data: OfferBanner }>(`/offer-banners/${id}`);
    return response.data.data;
  },

  async uploadOfferBanner(file: File, title?: string): Promise<OfferBanner> {
    const formData = new FormData();
    formData.append('file', file);
    if (title) {
      formData.append('title', title);
    }
    const response = await api.post<{ success: boolean; data: OfferBanner }>('/offer-banners', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async updateOfferBanner(id: string, data: { title?: string; isActive?: boolean }): Promise<OfferBanner> {
    const response = await api.put<{ success: boolean; data: OfferBanner }>(`/offer-banners/${id}`, data);
    return response.data.data;
  },

  async deleteOfferBanner(id: string): Promise<void> {
    await api.delete(`/offer-banners/${id}`);
  },
};


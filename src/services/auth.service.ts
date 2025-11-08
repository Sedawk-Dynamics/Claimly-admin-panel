import api from './api';
import { LoginResponse, Admin } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<{ success: boolean; data: LoginResponse }>('/admin/login', {
      email,
      password,
    });
    return response.data.data;
  },

  logout(): void {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
  },

  getStoredAdmin(): Admin | null {
    const adminStr = localStorage.getItem('admin');
    if (!adminStr) return null;
    try {
      return JSON.parse(adminStr);
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem('adminToken');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};


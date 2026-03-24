import { defineStore } from 'pinia';
import api from '../services/http';
import type { UserDTO } from '../types/api';

interface AuthState {
  token: string | null;
  user: UserDTO | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  settings: { showOnLeaderboard: boolean } | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    user: null,
    loading: false,
    error: null,
    initialized: false,
    settings: null
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token)
  },
  actions: {
    async restoreSession() {
      const token = localStorage.getItem('hd_token');
      if (token) {
        this.token = token;
        await this.fetchCurrentUser();
      }
      this.initialized = true;
    },
    async fetchCurrentUser() {
      try {
        const { data } = await api.get<{ user: UserDTO }>('/auth/me');
        this.user = data.user;
      } catch (error) {
        this.logout();
      }
    },
    async fetchSettings() {
      const { data } = await api.get<{ showOnLeaderboard: boolean }>('/user/settings');
      this.settings = { showOnLeaderboard: data.showOnLeaderboard };
    },
    async updateSettings(payload: { showOnLeaderboard: boolean }) {
      const { data } = await api.patch<{ showOnLeaderboard: boolean }>('/user/settings', payload);
      this.settings = { showOnLeaderboard: data.showOnLeaderboard };
    },
    async login(payload: { email: string; password: string }) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.post<{ token: string; user: UserDTO }>('/auth/login', payload);
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('hd_token', data.token);
      } catch (error: any) {
        this.error = error.response?.data?.message ?? 'Login fehlgeschlagen';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async register(payload: { email: string; password: string; displayName: string }) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.post<{ token: string; user: UserDTO }>('/auth/register', payload);
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('hd_token', data.token);
      } catch (error: any) {
        this.error = error.response?.data?.message ?? 'Registrierung fehlgeschlagen';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('hd_token');
      this.settings = null;
    }
  }
});

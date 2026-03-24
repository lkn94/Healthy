import { defineStore } from 'pinia';
import api from '../services/http';
import type { BodyResponse, OverviewResponse, ProgressResponse, CaloriesResponse } from '../types/api';

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    overview: null as OverviewResponse | null,
    progress: null as ProgressResponse | null,
    body: null as BodyResponse | null,
    calories: null as CaloriesResponse | null,
    loading: false
  }),
  actions: {
    async loadOverview() {
      this.loading = true;
      try {
        const { data } = await api.get<OverviewResponse>('/dashboard/overview');
        this.overview = data;
      } finally {
        this.loading = false;
      }
    },
    async loadProgress() {
      const { data } = await api.get<ProgressResponse>('/dashboard/progress');
      this.progress = data;
    },
    async loadBody() {
      const { data } = await api.get<BodyResponse>('/dashboard/body');
      this.body = data;
    },
    async loadCalories() {
      const { data } = await api.get<CaloriesResponse>('/dashboard/calories');
      this.calories = data;
    }
  }
});

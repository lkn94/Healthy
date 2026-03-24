import { defineStore } from 'pinia';
import api from '../services/http';
import type { LeaderboardEntryDTO } from '../types/api';

type SortOption = 'total' | 'today';

export const useLeaderboardStore = defineStore('leaderboard', {
  state: () => ({
    entries: [] as LeaderboardEntryDTO[],
    loading: false,
    sort: 'total' as SortOption
  }),
  actions: {
    async fetch(sort?: SortOption) {
      const targetSort = sort ?? this.sort;
      this.loading = true;
      try {
        const { data } = await api.get<{ entries: LeaderboardEntryDTO[] }>('/leaderboard', {
          params: { sort: targetSort }
        });
        this.entries = data.entries;
        this.sort = targetSort;
      } finally {
        this.loading = false;
      }
    }
  }
});

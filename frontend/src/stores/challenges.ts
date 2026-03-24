import { defineStore } from 'pinia';
import api from '../services/http';
import type { ChallengeDTO } from '../types/api';

export const useChallengesStore = defineStore('challenges', {
  state: () => ({
    challenges: [] as ChallengeDTO[],
    loading: false
  }),
  getters: {
    unlocked: (state) => state.challenges.filter((challenge) => challenge.unlocked),
    locked: (state) => state.challenges.filter((challenge) => !challenge.unlocked)
  },
  actions: {
    async fetchChallenges() {
      this.loading = true;
      try {
        const { data } = await api.get<{ challenges: ChallengeDTO[] }>('/dashboard/challenges');
        this.challenges = data.challenges;
      } finally {
        this.loading = false;
      }
    }
  }
});

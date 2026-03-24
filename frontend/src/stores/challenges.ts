import { defineStore } from 'pinia';
import api from '../services/http';
import type { ChallengeDTO } from '../types/api';

export const useChallengesStore = defineStore('challenges', {
  state: () => ({
    challenges: [] as ChallengeDTO[],
    dailyChallenges: [] as DailyChallenge[],
    loading: false
  }),
  getters: {
    unlocked: (state) => state.challenges.filter((challenge) => challenge.unlocked),
    locked: (state) => state.challenges.filter((challenge) => !challenge.unlocked),
    daily: (state) => state.dailyChallenges
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
    },
    async fetchDailyChallenges() {
      const { data } = await api.get<{ daily: DailyChallenge[] }>('/dashboard/challenges/daily');
      this.dailyChallenges = data.daily;
    }
  }
});

interface DailyChallenge {
  id: string;
  label: string;
  level: number;
  target: number;
  currentValue: number;
  completed: boolean;
}

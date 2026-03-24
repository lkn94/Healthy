import { defineStore } from 'pinia';
import api from '../services/http';
import type { ConnectionDTO, LifetimeStatDTO } from '../types/api';

export interface HaEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
}

interface ConnectionsState {
  connections: ConnectionDTO[];
  entities: HaEntity[];
  loading: boolean;
  syncJob: any | null;
  lifetimeStats: LifetimeStatDTO;
  loaded: boolean;
}

const emptyStats: LifetimeStatDTO = {
  totalSteps: 0,
  totalKm: 0,
  bestDaySteps: 0,
  bestWeekSteps: 0,
  currentStreak: 0,
  longestStreak: 0,
  daysTracked: 0
};

export const useConnectionsStore = defineStore('connections', {
  state: (): ConnectionsState => ({
    connections: [],
    entities: [],
    loading: false,
    syncJob: null,
    lifetimeStats: { ...emptyStats },
    loaded: false
  }),
  actions: {
    async fetchConnections() {
      this.loading = true;
      try {
        const { data } = await api.get<{ connections: ConnectionDTO[] }>('/connections');
        this.connections = data.connections;
        this.loaded = true;
      } finally {
        this.loading = false;
      }
    },
    async createConnection(payload: { name: string; baseUrl: string; accessToken: string }) {
      const { data } = await api.post<{ connection: ConnectionDTO }>('/connections', payload);
      this.connections.push(data.connection);
    },
    async deleteConnection(id: string) {
      await api.delete(`/connections/${id}`);
      this.connections = this.connections.filter((connection) => connection.id !== id);
    },
    async testConnection(id: string) {
      await api.post(`/connections/${id}/test`, {});
    },
    async fetchEntities(id: string) {
      const { data } = await api.get<{ entities: HaEntity[] }>(
        `/connections/${id}/entities`
      );
      this.entities = data.entities;
      return data.entities;
    },
    async saveMapping(id: string, mapping: Record<string, string>) {
      const { data } = await api.post(`/connections/${id}/mapping`, mapping);
      this.connections = this.connections.map((connection) =>
        connection.id === id ? { ...connection, mapping: data.mapping } : connection
      );
    },
    async triggerImport(id: string, fromDate: string) {
      const { data } = await api.post(`/connections/${id}/import`, { fromDate });
      return data;
    },
    async triggerSync(id: string) {
      const { data } = await api.post(`/connections/${id}/sync`, {});
      return data;
    },
    async fetchSyncStatus(id: string) {
      const { data } = await api.get(`/connections/${id}/sync-status`);
      this.syncJob = data.job;
      return data.job;
    },
    async fetchLifetimeStats() {
      try {
        const { data } = await api.get<LifetimeStatDTO>('/dashboard/lifetime');
        this.lifetimeStats = data;
      } catch (error) {
        this.lifetimeStats = { ...emptyStats };
      }
    }
  }
});

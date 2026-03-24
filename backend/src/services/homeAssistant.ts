import axios, { AxiosInstance } from 'axios';

export interface HaStateEntity {
  entity_id: string;
  state: string;
  last_changed: string;
  last_updated: string;
  attributes: Record<string, unknown>;
}

export type HistoryResponse = HaStateEntity[][];

const sanitizeBaseUrl = (url: string) => {
  if (url.endsWith('/')) {
    return url.slice(0, -1);
  }
  return url;
};

export class HomeAssistantClient {
  private client: AxiosInstance;

  constructor(baseUrl: string, accessToken: string) {
    this.client = axios.create({
      baseURL: sanitizeBaseUrl(baseUrl),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  async testConnection() {
    await this.client.get('/api/');
    return true;
  }

  async listEntities(): Promise<HaStateEntity[]> {
    const { data } = await this.client.get<HaStateEntity[]>('/api/states');
    return data;
  }

  async fetchHistory(params: {
    from: Date;
    to: Date;
    entityIds: string[];
  }): Promise<HistoryResponse> {
    if (!params.entityIds.length) {
      return [];
    }

    const { data } = await this.client.get<HistoryResponse>(
      `/api/history/period/${params.from.toISOString()}`,
      {
        params: {
          end_time: params.to.toISOString(),
          minimal_response: true,
          no_attributes: true,
          filter_entity_id: params.entityIds.join(',')
        }
      }
    );

    return data;
  }
}

export interface UserDTO {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface ConnectionDTO {
  id: string;
  name: string;
  baseUrl: string;
  status: string;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
  mapping?: {
    stepsEntityId: string;
    weightEntityId?: string | null;
    distanceEntityId?: string | null;
    activeMinutesEntityId?: string | null;
  } | null;
  lifetimeStat?: LifetimeStatDTO | null;
}

export interface LifetimeStatDTO {
  totalSteps: number;
  totalKm: number;
  bestDaySteps: number;
  bestWeekSteps: number;
  currentStreak: number;
  longestStreak: number;
  daysTracked: number;
}

export interface OverviewResponse {
  today: {
    steps: number;
    goal: number;
    average7: number;
    average30: number;
  };
  weekly: { date: string; steps: number }[];
  lifetime: LifetimeStatDTO;
}

export interface ProgressResponse {
  last7: { date: string; steps: number }[];
  last30: { date: string; steps: number }[];
  heatmap: { date: string; steps: number }[];
  records: { bestDaySteps: number; bestDayDate: string; bestWeekSteps: number };
}

export interface BodyResponse {
  trend: { date: string; weight?: number; activeMinutes: number }[];
  averageWeight: number | null;
}

export interface ChallengeDTO {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  criteria: Record<string, number>;
  progress: {
    totalSteps: number;
    longestStreak: number;
    bestWeekSteps: number;
  };
}

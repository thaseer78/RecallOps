import axios from 'axios';
import type {
  Incident,
  Investigation,
  Resolution,
  SettingsStatus,
  ActivityLog,
  MemoryOperation,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const incidentApi = {
  list: async (params?: { status?: string; severity?: string; service?: string; limit?: string; offset?: string }) => {
    const res = await api.get<{ data: Incident[]; total: number }>('/incidents', { params });
    return res.data;
  },

  get: async (id: string) => {
    const res = await api.get<{ data: Incident }>('/incidents/' + id);
    return res.data.data;
  },

  create: async (data: {
    title: string;
    service: string;
    severity: string;
    symptoms: string;
    logs?: string;
    isSynthetic?: boolean;
  }) => {
    const res = await api.post<{ data: Incident; message: string }>('/incidents', data);
    return res.data;
  },

  update: async (id: string, data: Partial<Incident>) => {
    const res = await api.patch<{ data: Incident; message: string }>('/incidents/' + id, data);
    return res.data;
  },

  investigate: async (id: string, overrides?: {
    title?: string;
    service?: string;
    severity?: string;
    symptoms?: string;
    logs?: string;
  }) => {
    const res = await api.post<{
      data: Investigation | null;
      hindsightConfigured: boolean;
      groqConfigured: boolean;
      memoriesFound: number;
      error?: string;
      message?: string;
      memoryRecallError?: string;
    }>('/incidents/' + id + '/investigate', overrides || {});
    return res.data;
  },

  resolve: async (id: string, data: {
    proposedCause?: string;
    actualCause: string;
    resolution: string;
    outcome: string;
  }) => {
    const res = await api.post<{
      data: Resolution;
      hindsightRetained: boolean;
      hindsightConfigured: boolean;
      memoryRef: string;
      retainError?: string;
      message: string;
    }>('/incidents/' + id + '/resolve', data);
    return res.data;
  },
};

export const memoryApi = {
  getMemories: async () => {
    const res = await api.get<{
      data: {
        stats: {
          totalRetains: number;
          totalRecalls: number;
          totalReflects: number;
          successfulRetains: number;
          hindsightConfigured: boolean;
          bankId: string;
        };
        recentOperations: MemoryOperation[];
        retainedLessons: Array<{
          incidentId: string;
          incidentTitle: string;
          service: string;
          severity: string;
          actualCause: string;
          resolution: string;
          outcome: string;
          memoryRef: string;
          resolvedAt: string;
        }>;
      };
    }>('/memories');
    return res.data.data;
  },

  recall: async (query: string) => {
    const res = await api.post<{
      data: {
        memories: Array<{ content?: string; score?: number; timestamp?: string }>;
        count: number;
        hindsightConfigured: boolean;
        error?: string;
      };
    }>('/memories/recall', { query });
    return res.data.data;
  },

  retain: async (content: string, context?: string) => {
    const res = await api.post<{
      data: { success: boolean; memoryRef: string; hindsightConfigured: boolean; error?: string };
      message: string;
    }>('/memories/retain', { content, context });
    return res.data;
  },
};

export const activityApi = {
  list: async () => {
    const res = await api.get<{ data: ActivityLog[] }>('/activity');
    return res.data.data;
  },
};

export const settingsApi = {
  getStatus: async () => {
    const res = await api.get<{ data: SettingsStatus }>('/settings/status');
    return res.data.data;
  },
};

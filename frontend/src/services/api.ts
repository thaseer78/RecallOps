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

// Interceptor: reject HTML responses (which occur when SPA rewrites intercept API routes)
api.interceptors.response.use(
  (response) => {
    if (
      typeof response.data === 'string' &&
      (response.data.trim().startsWith('<!DOCTYPE') ||
       response.data.trim().startsWith('<!doctype') ||
       response.data.trim().startsWith('<html'))
    ) {
      return Promise.reject(
        new Error(
          'RecallOps backend API not reachable. Please set VITE_API_BASE_URL to your backend server URL.'
        )
      );
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export const incidentApi = {
  list: async (params?: { status?: string; severity?: string; service?: string; limit?: string; offset?: string }) => {
    try {
      const res = await api.get<{ data: Incident[]; total: number }>('/incidents', { params });
      const items = Array.isArray(res.data?.data) ? res.data.data : [];
      const total = typeof res.data?.total === 'number' ? res.data.total : items.length;
      return { data: items, total };
    } catch (err) {
      console.warn('incidentApi.list failed:', err);
      return { data: [], total: 0 };
    }
  },

  get: async (id: string) => {
    try {
      const res = await api.get<{ data: Incident }>('/incidents/' + id);
      return res.data?.data || null;
    } catch (err) {
      console.warn('incidentApi.get failed:', err);
      return null;
    }
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
    const defaultStats = {
      totalRetains: 0,
      totalRecalls: 0,
      totalReflects: 0,
      successfulRetains: 0,
      hindsightConfigured: false,
      bankId: 'recallops-demo',
    };

    try {
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

      const payload = res.data?.data;
      return {
        stats: payload?.stats || defaultStats,
        recentOperations: Array.isArray(payload?.recentOperations) ? payload.recentOperations : [],
        retainedLessons: Array.isArray(payload?.retainedLessons) ? payload.retainedLessons : [],
      };
    } catch (err) {
      console.warn('memoryApi.getMemories failed:', err);
      return {
        stats: defaultStats,
        recentOperations: [],
        retainedLessons: [],
      };
    }
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
    try {
      const res = await api.get<{ data: ActivityLog[] }>('/activity');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch (err) {
      console.warn('activityApi.list failed:', err);
      return [];
    }
  },
};

export const settingsApi = {
  getStatus: async () => {
    try {
      const res = await api.get<{ data: SettingsStatus }>('/settings/status');
      return res.data?.data || null;
    } catch (err) {
      console.warn('settingsApi.getStatus failed:', err);
      return null;
    }
  },
};

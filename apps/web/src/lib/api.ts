import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Settings {
  id: string;
  timezone: string;
  model_identifier: string | null;
  conversation_session_ttl_minutes: number;
  handoff_ambiguity_attempts: number;
  staff_upcoming_notice_minutes: number;
  voice_note_max_seconds: number;
  allow_cancel: boolean;
  allow_reschedule: boolean;
  cancel_min_hours: number | null;
  reschedule_min_hours: number | null;
  max_reschedules: number | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateSettingsDto {
  timezone?: string;
  model_identifier?: string;
  conversation_session_ttl_minutes?: number;
  handoff_ambiguity_attempts?: number;
  staff_upcoming_notice_minutes?: number;
  voice_note_max_seconds?: number;
  allow_cancel?: boolean;
  allow_reschedule?: boolean;
  cancel_min_hours?: number | null;
  reschedule_min_hours?: number | null;
  max_reschedules?: number | null;
}

export const settingsApi = {
  get: async (): Promise<Settings> => {
    const response = await api.get<Settings>('/api/v1/settings');
    return response.data;
  },

  update: async (data: UpdateSettingsDto): Promise<Settings> => {
    const response = await api.patch<Settings>('/api/v1/settings', data);
    return response.data;
  },
};

export default api;

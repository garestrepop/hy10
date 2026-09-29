const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export interface StaffScheduleBlock {
  id: string;
  staff_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface StaffException {
  id: string;
  staff_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: 'block' | 'opening';
  reason?: string;
}

export interface Staff {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
}

export interface StaffSchedule {
  staff: Staff;
  blocks: StaffScheduleBlock[];
  exceptions: StaffException[];
}

export interface OccupancyData {
  start_date: string;
  end_date: string;
  total_appointments: number;
  total_revenue: number;
  staff_occupancy: Array<{
    staff_id: string;
    staff_name: string;
    total_appointments: number;
    upcoming_appointments: number;
    completed_appointments: number;
    total_hours: number;
  }>;
}

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers as Record<string, string>),
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async getAllStaffSchedules(): Promise<StaffSchedule[]> {
    return this.request<StaffSchedule[]>('/agenda/staff/schedules/all');
  }

  async getStaffSchedule(staffId: string): Promise<{
    blocks: StaffScheduleBlock[];
    exceptions: StaffException[];
  }> {
    return this.request(`/agenda/staff/${staffId}/schedule`);
  }

  async replaceStaffSchedule(
    staffId: string,
    blocks: Omit<StaffScheduleBlock, 'id' | 'staff_id'>[],
  ): Promise<StaffScheduleBlock[]> {
    return this.request<StaffScheduleBlock[]>('/agenda/staff/schedule', {
      method: 'POST',
      body: JSON.stringify({
        staff_id: staffId,
        blocks,
      }),
    });
  }

  async addException(exception: {
    staff_id: string;
    date: string;
    start_time: string;
    end_time: string;
    type: 'block' | 'opening';
    reason?: string;
  }): Promise<StaffException> {
    return this.request<StaffException>('/agenda/staff/exception', {
      method: 'POST',
      body: JSON.stringify(exception),
    });
  }

  async getOccupancy(
    startDate: string,
    endDate: string,
  ): Promise<OccupancyData> {
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    return this.request<OccupancyData>(`/agenda/occupancy?${params}`);
  }
}

export const apiClient = new ApiClient();

export class ServiceResponseDto {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
  is_active: boolean;
  allow_cancel: boolean | null;
  allow_reschedule: boolean | null;
  cancel_min_hours: number | null;
  reschedule_min_hours: number | null;
  max_reschedules: number | null;
  created_at: Date;
  updated_at: Date;
}

export class ResolvedPolicyDto {
  allow_cancel: boolean;
  allow_reschedule: boolean;
  cancel_min_hours: number | null;
  reschedule_min_hours: number | null;
  max_reschedules: number | null;
}

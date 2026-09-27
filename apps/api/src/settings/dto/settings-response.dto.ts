export class SettingsResponseDto {
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
  created_at: Date;
  updated_at: Date;
}

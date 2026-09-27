import { IsString, IsInt, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  model_identifier?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  conversation_session_ttl_minutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  handoff_ambiguity_attempts?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1440)
  staff_upcoming_notice_minutes?: number;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(300)
  voice_note_max_seconds?: number;

  @IsOptional()
  @IsBoolean()
  allow_cancel?: boolean;

  @IsOptional()
  @IsBoolean()
  allow_reschedule?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  cancel_min_hours?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  reschedule_min_hours?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  max_reschedules?: number | null;
}

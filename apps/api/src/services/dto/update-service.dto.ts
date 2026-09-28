import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration_minutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  price_cents?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  allow_cancel?: boolean | null;

  @IsOptional()
  @IsBoolean()
  allow_reschedule?: boolean | null;

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

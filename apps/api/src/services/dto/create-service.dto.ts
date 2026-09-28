import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsInt()
  @Min(1)
  duration_minutes: number;

  @IsInt()
  @Min(0)
  price_cents: number;

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

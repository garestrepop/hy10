import { IsString, IsInt, IsOptional, Min, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateServiceDto {
  @ApiPropertyOptional({ description: 'Service name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Service description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Duration in minutes', minimum: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  duration_minutes?: number;

  @ApiPropertyOptional({ description: 'Price in cents (COP)', minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  price_cents?: number;

  @ApiPropertyOptional({ description: 'Whether the service is active' })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Cancel window in hours' })
  @IsInt()
  @IsOptional()
  @Min(0)
  cancel_window_hours?: number;

  @ApiPropertyOptional({ description: 'Reschedule window in hours' })
  @IsInt()
  @IsOptional()
  @Min(0)
  reschedule_window_hours?: number;

  @ApiPropertyOptional({ description: 'Maximum number of reschedules allowed' })
  @IsInt()
  @IsOptional()
  @Min(0)
  max_reschedules?: number;
}

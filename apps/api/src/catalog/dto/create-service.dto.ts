import { IsString, IsInt, IsOptional, Min, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ description: 'Service name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Service description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Duration in minutes', minimum: 1 })
  @IsInt()
  @Min(1)
  duration_minutes: number;

  @ApiProperty({ description: 'Price in cents (COP)', minimum: 0 })
  @IsInt()
  @Min(0)
  price_cents: number;

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

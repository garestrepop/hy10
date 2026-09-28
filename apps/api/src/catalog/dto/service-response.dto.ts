import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Service } from '../entities/service.entity';

export class ServiceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiProperty()
  duration_minutes: number;

  @ApiProperty()
  price_cents: number;

  @ApiProperty()
  is_active: boolean;

  @ApiPropertyOptional()
  cancel_window_hours: number | null;

  @ApiPropertyOptional()
  reschedule_window_hours: number | null;

  @ApiPropertyOptional()
  max_reschedules: number | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  static fromEntity(service: Service): ServiceResponseDto {
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      duration_minutes: service.duration_minutes,
      price_cents: service.price_cents,
      is_active: service.is_active,
      cancel_window_hours: service.cancel_window_hours,
      reschedule_window_hours: service.reschedule_window_hours,
      max_reschedules: service.max_reschedules,
      created_at: service.created_at,
      updated_at: service.updated_at,
    };
  }
}

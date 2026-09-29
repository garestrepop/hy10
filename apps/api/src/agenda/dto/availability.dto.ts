import { IsUUID, IsString, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetAvailabilityDto {
  @ApiProperty({
    description: 'Service ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  service_id: string;

  @ApiProperty({
    description: 'Date in YYYY-MM-DD format',
    example: '2026-10-15',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date: string;

  @ApiProperty({
    description: 'Optional staff ID to filter availability',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  staff_id?: string;
}

export class SlotDto {
  @ApiProperty({
    description: 'Slot start time in ISO 8601 format',
    example: '2026-10-15T09:00:00-05:00',
  })
  start: string;

  @ApiProperty({
    description: 'Slot end time in ISO 8601 format',
    example: '2026-10-15T09:30:00-05:00',
  })
  end: string;

  @ApiProperty({
    description: 'Staff ID who can provide this slot',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  staff_id: string;

  @ApiProperty({
    description: 'Staff display name',
    example: 'John Doe',
  })
  staff_name: string;
}

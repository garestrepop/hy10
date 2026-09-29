import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class AvailabilityQueryDto {
  @ApiProperty({ 
    description: 'Service ID to check availability for',
    required: true 
  })
  @IsUUID()
  @IsString()
  service_id: string;

  @ApiProperty({ 
    description: 'Date to check availability (ISO 8601 date format)', 
    example: '2026-09-30',
    required: true
  })
  @IsDateString()
  date: string;

  @ApiProperty({ 
    description: 'Optional staff ID to filter availability',
    required: false 
  })
  @IsOptional()
  @IsUUID()
  @IsString()
  staff_id?: string;
}

import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExceptionType } from '../entities/staff-exception.entity';

export class AddExceptionDto {
  @ApiProperty({
    description: 'Staff user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  staff_id: string;

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
    description: 'Start time in HH:mm format',
    example: '09:00',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'start_time must be in HH:mm format',
  })
  start_time: string;

  @ApiProperty({
    description: 'End time in HH:mm format',
    example: '12:00',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'end_time must be in HH:mm format',
  })
  end_time: string;

  @ApiProperty({
    description: 'Exception type: block (unavailable) or opening (available override)',
    enum: ExceptionType,
    example: ExceptionType.BLOCK,
  })
  @IsEnum(ExceptionType)
  type: ExceptionType;

  @ApiProperty({
    description: 'Optional reason for the exception',
    example: 'Vacation',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

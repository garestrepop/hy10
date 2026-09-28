import {
  IsEnum,
  IsString,
  Matches,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ExceptionType } from '../entities/schedule-exception.entity';

export class CreateExceptionDto {
  @IsEnum(ExceptionType)
  exception_type: ExceptionType;

  @IsDateString()
  exception_date: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'start_time must be in HH:MM or HH:MM:SS format',
  })
  start_time?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'end_time must be in HH:MM or HH:MM:SS format',
  })
  end_time?: string;
}

export class ExceptionResponseDto {
  id: string;
  staff_id: string;
  exception_type: ExceptionType;
  exception_date: string;
  start_time: string | null;
  end_time: string | null;
  created_at: Date;
  updated_at: Date;
}

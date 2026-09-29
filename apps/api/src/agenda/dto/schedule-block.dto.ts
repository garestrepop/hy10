import {
  IsEnum,
  IsString,
  Matches,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DayOfWeek } from '../entities/schedule-block.entity';

export class ScheduleBlockDto {
  @IsEnum(DayOfWeek)
  day_of_week: DayOfWeek;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'start_time must be in HH:MM or HH:MM:SS format',
  })
  start_time: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'end_time must be in HH:MM or HH:MM:SS format',
  })
  end_time: string;
}

export class ReplaceScheduleDto {
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => ScheduleBlockDto)
  blocks: ScheduleBlockDto[];
}

export class ScheduleBlockResponseDto {
  id: string;
  staff_id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  created_at: Date;
  updated_at: Date;
}

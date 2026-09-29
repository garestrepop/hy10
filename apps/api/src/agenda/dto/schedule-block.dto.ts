import { IsInt, IsString, IsUUID, Min, Max, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ScheduleBlockDto {
  @ApiProperty({
    description: 'Day of week (0=Sunday, 6=Saturday)',
    minimum: 0,
    maximum: 6,
    example: 1,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week: number;

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
    example: '17:00',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'end_time must be in HH:mm format',
  })
  end_time: string;
}

export class ReplaceStaffScheduleDto {
  @ApiProperty({
    description: 'Staff user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  staff_id: string;

  @ApiProperty({
    description: 'Array of schedule blocks',
    type: [ScheduleBlockDto],
  })
  blocks: ScheduleBlockDto[];
}

import { ApiProperty } from '@nestjs/swagger';

export class TimeSlotDto {
  @ApiProperty({ description: 'Start time of the slot (ISO 8601)', example: '2026-09-30T10:00:00Z' })
  start_time: string;

  @ApiProperty({ description: 'End time of the slot (ISO 8601)', example: '2026-09-30T11:00:00Z' })
  end_time: string;

  @ApiProperty({ description: 'Staff member ID for this slot' })
  staff_id: string;

  @ApiProperty({ description: 'Staff member name' })
  staff_name: string;

  @ApiProperty({ description: 'Whether this slot is available', default: true })
  is_available: boolean;
}

export class AvailabilityResponseDto {
  @ApiProperty({ description: 'Service ID queried' })
  service_id: string;

  @ApiProperty({ description: 'Service name' })
  service_name: string;

  @ApiProperty({ description: 'Date queried (ISO 8601 date)', example: '2026-09-30' })
  date: string;

  @ApiProperty({ description: 'Staff ID filter applied (if any)', required: false })
  staff_id?: string;

  @ApiProperty({ description: 'Available time slots', type: [TimeSlotDto] })
  slots: TimeSlotDto[];

  @ApiProperty({ description: 'Total number of available slots' })
  total_slots: number;
}

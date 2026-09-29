import { ApiProperty } from '@nestjs/swagger';

export class StaffOccupancyDto {
  @ApiProperty({
    description: 'Staff ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  staff_id: string;

  @ApiProperty({
    description: 'Staff name',
    example: 'John Doe',
  })
  staff_name: string;

  @ApiProperty({
    description: 'Total appointments',
    example: 15,
  })
  total_appointments: number;

  @ApiProperty({
    description: 'Upcoming appointments',
    example: 8,
  })
  upcoming_appointments: number;

  @ApiProperty({
    description: 'Completed appointments',
    example: 7,
  })
  completed_appointments: number;

  @ApiProperty({
    description: 'Total hours scheduled',
    example: 7.5,
  })
  total_hours: number;
}

export class OccupancyResponseDto {
  @ApiProperty({
    description: 'Date range start',
    example: '2026-09-29',
  })
  start_date: string;

  @ApiProperty({
    description: 'Date range end',
    example: '2026-10-29',
  })
  end_date: string;

  @ApiProperty({
    description: 'Total appointments across all staff',
    example: 45,
  })
  total_appointments: number;

  @ApiProperty({
    description: 'Total revenue in cents',
    example: 1250000,
  })
  total_revenue: number;

  @ApiProperty({
    description: 'Staff occupancy breakdown',
    type: [StaffOccupancyDto],
  })
  staff_occupancy: StaffOccupancyDto[];
}

import { ApiProperty } from '@nestjs/swagger';

export class ReservationSummaryDto {
  @ApiProperty({ description: 'Reservation ID' })
  id: string;

  @ApiProperty({ description: 'Service name' })
  service_name: string;

  @ApiProperty({ description: 'Staff member name' })
  staff_name: string;

  @ApiProperty({ description: 'Client name' })
  client_name: string;

  @ApiProperty({ description: 'Start time (ISO 8601)', example: '2026-09-29T10:00:00Z' })
  start_time: string;

  @ApiProperty({ description: 'End time (ISO 8601)', example: '2026-09-29T11:00:00Z' })
  end_time: string;

  @ApiProperty({ description: 'Reservation status', enum: ['confirmed', 'cancelled', 'completed', 'no_show'] })
  status: string;
}

export class StaffOccupationDto {
  @ApiProperty({ description: 'Staff member ID' })
  staff_id: string;

  @ApiProperty({ description: 'Staff member name' })
  staff_name: string;

  @ApiProperty({ description: 'Staff member email' })
  staff_email: string;

  @ApiProperty({ description: 'Number of active reservations' })
  active_reservations_count: number;

  @ApiProperty({ description: 'Upcoming reservations', type: [ReservationSummaryDto] })
  upcoming_reservations: ReservationSummaryDto[];
}

export class OccupationResponseDto {
  @ApiProperty({ description: 'Query timestamp (ISO 8601)' })
  timestamp: string;

  @ApiProperty({ description: 'Total active reservations across all staff' })
  total_active_reservations: number;

  @ApiProperty({ description: 'Total staff members' })
  total_staff: number;

  @ApiProperty({ description: 'Occupation by staff member', type: [StaffOccupationDto] })
  staff_occupation: StaffOccupationDto[];
}

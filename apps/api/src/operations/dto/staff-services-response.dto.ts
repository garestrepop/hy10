import { ApiProperty } from '@nestjs/swagger';

export class ServiceBasicDto {
  @ApiProperty({ description: 'Service ID' })
  id: string;

  @ApiProperty({ description: 'Service name' })
  name: string;

  @ApiProperty({ description: 'Service description' })
  description: string;

  @ApiProperty({ description: 'Duration in minutes' })
  duration_minutes: number;

  @ApiProperty({ description: 'Price in cents (COP)' })
  price_cents: number;

  @ApiProperty({ description: 'Whether service is active' })
  is_active: boolean;
}

export class StaffMemberDto {
  @ApiProperty({ description: 'Staff member ID' })
  id: string;

  @ApiProperty({ description: 'Staff member name' })
  name: string;

  @ApiProperty({ description: 'Staff member email' })
  email: string;

  @ApiProperty({ description: 'Whether staff is active' })
  is_active: boolean;
}

export class ServiceWithStaffDto {
  @ApiProperty({ description: 'Service details', type: ServiceBasicDto })
  service: ServiceBasicDto;

  @ApiProperty({ description: 'Staff members who provide this service', type: [StaffMemberDto] })
  staff: StaffMemberDto[];
}

export class StaffServicesResponseDto {
  @ApiProperty({ description: 'Query timestamp (ISO 8601)' })
  timestamp: string;

  @ApiProperty({ description: 'Total number of services' })
  total_services: number;

  @ApiProperty({ description: 'Services with their assigned staff', type: [ServiceWithStaffDto] })
  services: ServiceWithStaffDto[];
}

import { ApiProperty } from '@nestjs/swagger';

export class StaffInvitationResponseDto {
  @ApiProperty({ example: 'abc123def456...' })
  token: string;

  @ApiProperty({ example: 'staff@example.com' })
  email: string;

  @ApiProperty({ example: '2024-10-05T10:00:00Z' })
  expires_at: Date;

  @ApiProperty({ example: 'admin@example.com' })
  invited_by_email: string;
}

export class InvitationInfoDto {
  @ApiProperty({ example: 'staff@example.com' })
  email: string;

  @ApiProperty({ example: false })
  email_exists: boolean;

  @ApiProperty({ example: '2024-10-05T10:00:00Z' })
  expires_at: Date;

  @ApiProperty({ example: false })
  is_expired: boolean;

  @ApiProperty({ example: false })
  is_used: boolean;
}

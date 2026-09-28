import { ApiProperty } from '@nestjs/swagger';

export class MfaRequiredResponseDto {
  @ApiProperty({
    description: 'Indicates that MFA verification is required',
    example: true,
  })
  mfa_required: boolean;

  @ApiProperty({
    description: 'Temporary token to use for MFA verification',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  mfa_token: string;

  @ApiProperty({
    description: 'User email',
    example: 'admin@example.com',
  })
  email: string;
}

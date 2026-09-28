import { ApiProperty } from '@nestjs/swagger';

export class MfaSetupResponseDto {
  @ApiProperty({
    description: 'Secret key for MFA setup (base32 encoded)',
    example: 'JBSWY3DPEHPK3PXP',
  })
  secret: string;

  @ApiProperty({
    description: 'OTP Auth URL for QR code generation',
    example: 'otpauth://totp/hy10:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=hy10',
  })
  otpauth_url: string;

  @ApiProperty({
    description: 'QR code data URL (base64 encoded PNG)',
    example: 'data:image/png;base64,iVBORw0KG...',
  })
  qr_code: string;
}

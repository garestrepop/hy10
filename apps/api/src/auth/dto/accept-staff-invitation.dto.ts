import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AcceptStaffInvitationDto {
  @ApiProperty({
    example: 'abc123def456...',
    description: 'Invitation token',
  })
  @IsString()
  token: string;

  @ApiPropertyOptional({
    example: 'SecurePass123!',
    description: 'Password for new account (required if email does not exist)',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({
    example: 'John',
    description: 'First name for new account',
  })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'Last name for new account',
  })
  @IsOptional()
  @IsString()
  last_name?: string;
}

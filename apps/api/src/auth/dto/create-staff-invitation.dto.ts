import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStaffInvitationDto {
  @ApiProperty({
    example: 'staff@example.com',
    description: 'Email address to invite',
  })
  @IsEmail()
  email: string;
}

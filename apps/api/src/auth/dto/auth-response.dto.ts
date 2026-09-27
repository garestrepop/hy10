import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty()
  refresh_token: string;

  @ApiProperty()
  token_type: string;

  @ApiProperty()
  expires_in: number;

  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string' },
      email: { type: 'string' },
      role: { type: 'string', enum: ['admin', 'staff'] },
      first_name: { type: 'string', nullable: true },
      last_name: { type: 'string', nullable: true },
    },
  })
  user: {
    id: string;
    email: string;
    role: string;
    first_name: string | null;
    last_name: string | null;
  };
}

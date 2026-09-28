import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssociateStaffDto {
  @ApiProperty({ 
    description: 'Array of staff user IDs to associate with this service',
    type: [String]
  })
  @IsArray()
  @IsUUID('4', { each: true })
  staff_ids: string[];
}

import { IsArray, IsUUID } from 'class-validator';

export class AssociateStaffDto {
  @IsArray()
  @IsUUID('4', { each: true })
  staff_ids: string[];
}

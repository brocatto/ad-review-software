import { IsUUID } from 'class-validator';

export class ApproveDto {
  @IsUUID()
  creativeId: string;
}

import { IsString, IsUUID } from 'class-validator';

export class CreateBatchDto {
  @IsString()
  name: string;

  @IsUUID()
  clientId: string;
}

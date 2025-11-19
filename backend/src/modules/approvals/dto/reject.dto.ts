import { IsUUID, IsString, IsOptional } from 'class-validator';

export class RejectDto {
  @IsUUID()
  creativeId: string;

  @IsOptional()
  @IsString()
  feedback?: string;
}

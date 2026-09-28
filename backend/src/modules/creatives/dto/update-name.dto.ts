import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateNameDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}

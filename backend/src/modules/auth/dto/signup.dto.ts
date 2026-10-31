import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
  @MaxLength(128)
  password: string;

  @IsString()
  @MinLength(2, { message: 'Informe seu nome' })
  @MaxLength(120)
  fullName: string;
}

export class GoogleAuthDto {
  @IsString()
  idToken: string;
}

export class ResendVerificationDto {
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;
}

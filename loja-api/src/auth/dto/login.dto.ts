import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'ana', minLength: 2 })
  @IsString({ message: 'username deve ser um texto' })
  @MinLength(2, { message: 'username deve ter pelo menos 2 caracteres' })
  username: string;

  @ApiProperty({ example: 'secret123', minLength: 6, writeOnly: true })
  @IsString({ message: 'password deve ser um texto' })
  @MinLength(6, { message: 'password deve ter pelo menos 6 caracteres' })
  password: string;
}

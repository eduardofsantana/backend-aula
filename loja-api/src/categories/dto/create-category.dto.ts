import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Canecas', minLength: 2, maxLength: 100 })
  @IsString({ message: 'name deve ser um texto' })
  @MinLength(2, { message: 'name deve ter pelo menos 2 caracteres' })
  name: string;
}

import { IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString({ message: 'name deve ser um texto' })
  @MinLength(2, { message: 'name deve ter pelo menos 2 caracteres' })
  name: string;
}

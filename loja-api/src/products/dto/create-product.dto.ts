import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsString, Min, MinLength } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Caneca Nest', minLength: 2 })
  @IsString({ message: 'name deve ser um texto' })
  @MinLength(2, { message: 'Informe um nome com pelo menos 2 caracteres' })
  name: string;

  @ApiProperty({ example: 39.9, minimum: 0.01 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'price deve ser um número com até 2 casas decimais' },
  )
  @Min(0.01, { message: 'price deve ser maior que zero' })
  price: number;

  @ApiProperty({ example: 10, minimum: 0 })
  @IsInt({ message: 'stock deve ser um número inteiro' })
  @Min(0, { message: 'stock não pode ser negativo' })
  stock: number;
}

import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class PatchProductDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Informe um nome com pelo menos 2 caracteres' })
  name?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'price deve ser maior que zero' })
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'stock não pode ser negativo' })
  stock?: number;
}

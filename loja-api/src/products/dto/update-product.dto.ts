import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @ApiPropertyOptional({ example: 'Caneca Nest', minLength: 2 })
  @IsString({ message: 'name deve ser um texto' })
  @MinLength(2, { message: 'Informe um nome com pelo menos 2 caracteres' })
  name?: string;

  @IsOptional()
  @ApiPropertyOptional({ example: 39.9, minimum: 0.01, maximum: 99999999.99 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'price deve ser um número com até 2 casas decimais' },
  )
  @Min(0.01, { message: 'price deve ser maior que zero' })
  price?: number;

  @IsOptional()
  @ApiPropertyOptional({ example: 10, minimum: 0 })
  @IsInt({ message: 'stock deve ser um número inteiro' })
  @Min(0, { message: 'stock não pode ser negativo' })
  stock?: number;
}

export class ListProductsQueryDto {
  @IsOptional()
  @ApiPropertyOptional({ example: 'Caneca' })
  @IsString({ message: 'category deve ser um texto' })
  category?: string;

  @IsOptional()
  @ApiPropertyOptional({ example: 'caneca' })
  @IsString({ message: 'q deve ser um texto' })
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional({ example: 10, minimum: 0, type: Number })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'minPrice deve ser um número com até 2 casas decimais' },
  )
  @Min(0, { message: 'minPrice não pode ser negativo' })
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional({ example: 50, minimum: 0, type: Number })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'maxPrice deve ser um número com até 2 casas decimais' },
  )
  @Min(0, { message: 'maxPrice não pode ser negativo' })
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional({ example: 1, minimum: 1, type: Number })
  @IsInt({ message: 'page deve ser um número inteiro' })
  @Min(1, { message: 'page deve ser pelo menos 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100, type: Number })
  @IsInt({ message: 'limit deve ser um número inteiro' })
  @Min(1, { message: 'limit deve ser pelo menos 1' })
  @Max(100, { message: 'limit não pode ser maior que 100' })
  limit?: number = 20;
}

export class IdParamDto {
  @Type(() => Number)
  @IsInt({ message: 'id deve ser inteiro' })
  @Min(1, { message: 'id deve ser maior que zero' })
  id: number;
}

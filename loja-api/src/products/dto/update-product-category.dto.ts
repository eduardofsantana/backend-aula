import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, ValidateIf } from 'class-validator';

export class UpdateProductCategoryDto {
  @ApiProperty({
    example: 1,
    nullable: true,
    description: 'ID da categoria; null remove a associação',
  })
  @ValidateIf((_object, value) => value !== null)
  @Type(() => Number)
  @IsInt({ message: 'categoryId deve ser um número inteiro ou null' })
  @Min(1, { message: 'categoryId deve ser maior que zero' })
  categoryId: number | null;
}

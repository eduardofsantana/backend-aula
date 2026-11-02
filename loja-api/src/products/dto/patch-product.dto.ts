import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

export class PatchProductDto extends PartialType(CreateProductDto) {}

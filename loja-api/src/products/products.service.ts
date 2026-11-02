import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  And,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { PatchProductDto } from './dto/patch-product.dto';
import {
  ListProductsQueryDto,
  UpdateProductDto,
} from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  findAll({ q, minPrice, maxPrice }: ListProductsQueryDto = {}): Promise<
    Product[]
  > {
    if (!q && minPrice === undefined && maxPrice === undefined) {
      return this.productsRepository.find();
    }

    const where: FindOptionsWhere<Product> = {};
    if (q) {
      const escapedQuery = q.replace(/[\\%_]/g, '\\$&');
      where.name = ILike(`%${escapedQuery}%`);
    }
    if (minPrice !== undefined && maxPrice !== undefined) {
      where.price = And(MoreThanOrEqual(minPrice), LessThanOrEqual(maxPrice));
    } else if (minPrice !== undefined) {
      where.price = MoreThanOrEqual(minPrice);
    } else if (maxPrice !== undefined) {
      where.price = LessThanOrEqual(maxPrice);
    }

    return this.productsRepository.find({ where });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Produto ${id} não encontrado`);
    }
    return product;
  }

  create(dto: CreateProductDto): Promise<Product> {
    const product = this.productsRepository.create(dto);
    return this.productsRepository.save(product);
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    return this.saveChanges(id, dto);
  }

  async patch(id: number, dto: PatchProductDto): Promise<Product> {
    return this.saveChanges(id, dto);
  }

  private async saveChanges(
    id: number,
    dto: Partial<Pick<Product, 'name' | 'price' | 'stock'>>,
  ): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, dto);
    return this.productsRepository.save(product);
  }

  async updateImageFilename(
    id: number,
    filename: string | null,
  ): Promise<Product> {
    const product = await this.findOne(id);
    product.imageFilename = filename;
    return this.productsRepository.save(product);
  }

  async remove(id: number): Promise<void> {
    const result = await this.productsRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Produto ${id} não encontrado`);
    }
  }
}

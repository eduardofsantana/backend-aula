import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { unlink } from 'fs/promises';
import { basename, join } from 'path';
import {
  And,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Category } from '../categories/category.entity';
import { Product } from './product.entity';
import { ProductImage } from './product-image.entity';
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
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(ProductImage)
    private readonly productImagesRepository: Repository<ProductImage>,
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

  async updateCategory(
    id: number,
    categoryId: number | null,
  ): Promise<Product> {
    const product = await this.findOne(id);
    if (categoryId === null) {
      product.category = null;
      product.categoryId = null;
    } else {
      const category = await this.categoriesRepository.findOne({
        where: { id: categoryId },
      });
      if (!category) {
        throw new NotFoundException(`Categoria ${categoryId} não encontrada`);
      }
      product.category = category;
      product.categoryId = category.id;
    }
    return this.productsRepository.save(product);
  }

  findByCategoryId(categoryId: number): Promise<Product[]> {
    return this.productsRepository.find({ where: { categoryId } });
  }

  async addImages(
    productId: number,
    images: Array<
      Pick<ProductImage, 'filename' | 'mimeType' | 'size' | 'originalName'>
    >,
  ): Promise<ProductImage[]> {
    await this.findOne(productId);
    const records = images.map((image) =>
      this.productImagesRepository.create({ ...image, productId }),
    );
    return this.productImagesRepository.save(records);
  }

  async findImages(productId: number): Promise<ProductImage[]> {
    await this.findOne(productId);
    return this.productImagesRepository.find({
      where: { productId },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
  }

  async findImage(productId: number, imageId: number): Promise<ProductImage> {
    const image = await this.productImagesRepository.findOne({
      where: { id: imageId, productId },
    });
    if (!image) {
      throw new NotFoundException(
        `Imagem ${imageId} não encontrada no produto ${productId}`,
      );
    }
    return image;
  }

  async deleteImage(productId: number, imageId: number): Promise<ProductImage> {
    const image = await this.findImage(productId, imageId);
    await this.productImagesRepository.delete({ id: imageId, productId });
    return image;
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
    const images = await this.productImagesRepository.find({
      where: { productId: id },
    });
    const result = await this.productsRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Produto ${id} não encontrado`);
    }
    await Promise.all(
      images.map((image) =>
        unlink(join(process.cwd(), 'uploads', basename(image.filename))),
      ),
    );
  }
}

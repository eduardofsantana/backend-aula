import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';

@Injectable()
export class CatalogService {
  constructor(private readonly productsService: ProductsService) {}

  async getSummary(): Promise<{
    totalProducts: number;
    totalStockUnits: number;
  }> {
    const products = await this.productsService.findAll();
    return {
      totalProducts: products.length,
      totalStockUnits: products.reduce(
        (total, product) => total + product.stock,
        0,
      ),
    };
  }
}

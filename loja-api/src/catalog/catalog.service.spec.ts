import { ProductsService } from '../products/products.service';
import { CatalogService } from './catalog.service';

describe('CatalogService', () => {
  it('calculates the product count and total stock units', async () => {
    const productsService = {
      findAll: jest.fn().mockResolvedValue([
        { id: 1, name: 'Caneca Nest', stock: 10 },
        { id: 2, name: 'Camiseta ADS', stock: 25 },
      ]),
    } as unknown as ProductsService;
    const catalogService = new CatalogService(productsService);

    await expect(catalogService.getSummary()).resolves.toEqual({
      totalProducts: 2,
      totalStockUnits: 35,
    });
    expect(productsService.findAll).toHaveBeenCalledWith();
  });

  it('returns zero totals when the catalog is empty', async () => {
    const productsService = {
      findAll: jest.fn().mockResolvedValue([]),
    } as unknown as ProductsService;
    const catalogService = new CatalogService(productsService);

    await expect(catalogService.getSummary()).resolves.toEqual({
      totalProducts: 0,
      totalStockUnits: 0,
    });
  });
});

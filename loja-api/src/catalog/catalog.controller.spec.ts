import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';

describe('CatalogController', () => {
  it('returns the catalog summary from the service', async () => {
    const summary = { totalProducts: 2, totalStockUnits: 35 };
    const catalogService = {
      getSummary: jest.fn().mockResolvedValue(summary),
    } as unknown as CatalogService;
    const controller = new CatalogController(catalogService);

    await expect(controller.getSummary()).resolves.toEqual(summary);
    expect(catalogService.getSummary).toHaveBeenCalledWith();
  });
});

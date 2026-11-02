jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  it('should create and update a product', async () => {
    const createdProduct = {
      id: 1,
      name: 'Notebook',
      price: 2500,
      stock: 10,
    };
    const updatedProduct = {
      ...createdProduct,
      name: 'Notebook Gamer',
      price: 3200,
      stock: 5,
    };
    const productsService = {
      create: jest.fn().mockResolvedValue(createdProduct),
      update: jest.fn().mockResolvedValue(updatedProduct),
      findAll: jest.fn().mockResolvedValue([createdProduct]),
      patch: jest.fn().mockResolvedValue({
        ...createdProduct,
        stock: 5,
      }),
    } as unknown as ProductsService;
    const controller = new ProductsController(productsService);

    const created = await controller.create({
      name: 'Notebook',
      price: 2500,
      stock: 10,
    });

    expect(created).toMatchObject({
      id: 1,
      name: 'Notebook',
      price: 2500,
      stock: 10,
    });

    const updated = await controller.update('1', {
      name: 'Notebook Gamer',
      price: 3200,
      stock: 5,
    });

    expect(updated).toMatchObject({
      id: 1,
      name: 'Notebook Gamer',
      price: 3200,
      stock: 5,
    });

    const patched = await controller.patch(1, { stock: 5 });
    expect(productsService.patch).toHaveBeenCalledWith(1, { stock: 5 });
    expect(patched).toMatchObject({
      id: 1,
      name: 'Notebook',
      price: 2500,
      stock: 5,
    });

    const query = { q: 'notebook', minPrice: 100, maxPrice: 3000 };
    await controller.findAll(query);
    expect(productsService.findAll).toHaveBeenCalledWith(query);
  });
});

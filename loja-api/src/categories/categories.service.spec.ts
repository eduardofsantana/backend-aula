jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

import { Repository } from 'typeorm';
import { ProductsService } from '../products/products.service';
import { Category } from './category.entity';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  const categoriesRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<Repository<Category>>;
  const findByCategoryId = jest.fn();
  const productsService = {
    findByCategoryId,
  } as unknown as ProductsService;
  const service = new CategoriesService(categoriesRepository, productsService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists products for an existing category through ProductsService', async () => {
    const category = { id: 2, name: 'Canecas' } as Category;
    const products = [{ id: 1, name: 'Caneca Nest', categoryId: 2 }];
    categoriesRepository.findOne.mockResolvedValue(category);
    findByCategoryId.mockResolvedValue(products);

    await expect(service.findProducts(2)).resolves.toEqual(products);
    expect(findByCategoryId).toHaveBeenCalledWith(2);
  });

  it('does not query products for a missing category', async () => {
    categoriesRepository.findOne.mockResolvedValue(null);

    await expect(service.findProducts(404)).rejects.toThrow(
      'Categoria 404 não encontrada',
    );
    expect(findByCategoryId).not.toHaveBeenCalled();
  });
});

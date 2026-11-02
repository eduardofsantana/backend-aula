jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

import { ILike, Repository } from 'typeorm';
import { Product } from './product.entity';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const productsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  } as unknown as jest.Mocked<Repository<Product>>;
  const service = new ProductsService(productsRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('filters product names by case-insensitive substring', async () => {
    productsRepository.find.mockResolvedValue([]);

    await service.findAll({ q: 'Caneca' });

    expect(productsRepository.find).toHaveBeenCalledWith({
      where: { name: ILike('%Caneca%') },
    });
  });

  it('escapes wildcard characters in the search term', async () => {
    productsRepository.find.mockResolvedValue([]);

    await service.findAll({ q: '100%_' });

    const options = productsRepository.find.mock.calls[0][0];
    const nameFilter =
      options.where && !Array.isArray(options.where)
        ? options.where.name
        : undefined;
    expect(nameFilter).toBeInstanceOf(Object);
    expect(nameFilter).toMatchObject({ _type: 'ilike', _value: '%100\\%\\_%' });
  });

  it('filters by inclusive minimum and maximum prices', async () => {
    productsRepository.find.mockResolvedValue([]);

    await service.findAll({ minPrice: 10, maxPrice: 50 });

    const options = productsRepository.find.mock.calls[0][0];
    expect(options.where).toMatchObject({
      price: {
        _type: 'and',
        _value: [
          { _type: 'moreThanOrEqual', _value: 10 },
          { _type: 'lessThanOrEqual', _value: 50 },
        ],
      },
    });
  });

  it('combines name and price filters', async () => {
    productsRepository.find.mockResolvedValue([]);

    await service.findAll({ q: 'Caneca', minPrice: 10 });

    const options = productsRepository.find.mock.calls[0][0];
    expect(options.where).toMatchObject({
      name: { _type: 'ilike', _value: '%Caneca%' },
      price: { _type: 'moreThanOrEqual', _value: 10 },
    });
  });

  it('updates only fields provided to patch', async () => {
    const existingProduct: Product = {
      id: 1,
      name: 'Caneca Nest',
      price: 39.9,
      stock: 10,
      imageFilename: null,
    };
    productsRepository.findOne.mockResolvedValue(existingProduct);
    productsRepository.save.mockImplementation(async () => existingProduct);

    const result = await service.patch(1, { stock: 4 });

    expect(result).toMatchObject({
      id: 1,
      name: 'Caneca Nest',
      price: 39.9,
      stock: 4,
      imageFilename: null,
    });
  });
});

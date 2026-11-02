jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

import { ILike, Repository } from 'typeorm';
import { Category } from '../categories/category.entity';
import { ProductImage } from './product-image.entity';
import { Product } from './product.entity';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const productsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  } as unknown as jest.Mocked<Repository<Product>>;
  const categoriesRepository = {
    findOne: jest.fn(),
  } as unknown as jest.Mocked<Repository<Category>>;
  const productImagesRepository = {
    create: jest.fn((image) => image),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<Repository<ProductImage>>;
  const service = new ProductsService(
    productsRepository,
    categoriesRepository,
    productImagesRepository,
  );

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
      categoryId: null,
      category: null,
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

  it('associates a product with an existing category', async () => {
    const category = { id: 2, name: 'Canecas' } as Category;
    const product: Product = {
      id: 1,
      name: 'Caneca Nest',
      price: 39.9,
      stock: 10,
      imageFilename: null,
      categoryId: null,
      category: null,
    };
    productsRepository.findOne.mockResolvedValue(product);
    categoriesRepository.findOne.mockResolvedValue(category);
    productsRepository.save.mockImplementation(async () => product);

    await service.updateCategory(1, 2);

    expect(product.categoryId).toBe(2);
    expect(product.category).toBe(category);
    expect(productsRepository.save).toHaveBeenCalledWith(product);
  });

  it('removes a product category when categoryId is null', async () => {
    const product: Product = {
      id: 1,
      name: 'Caneca Nest',
      price: 39.9,
      stock: 10,
      imageFilename: null,
      categoryId: 2,
      category: { id: 2, name: 'Canecas' } as Category,
    };
    productsRepository.findOne.mockResolvedValue(product);
    productsRepository.save.mockImplementation(async () => product);

    await service.updateCategory(1, null);

    expect(product.categoryId).toBeNull();
    expect(product.category).toBeNull();
  });

  it('rejects associations to a missing category', async () => {
    productsRepository.findOne.mockResolvedValue({
      id: 1,
      categoryId: null,
      category: null,
    } as Product);
    categoriesRepository.findOne.mockResolvedValue(null);

    await expect(service.updateCategory(1, 404)).rejects.toThrow(
      'Categoria 404 não encontrada',
    );
  });

  it('stores metadata for multiple product images', async () => {
    productsRepository.findOne.mockResolvedValue({ id: 1 } as Product);
    const records = [
      { id: 1, productId: 1, filename: 'one.jpg' },
      { id: 2, productId: 1, filename: 'two.png' },
    ] as ProductImage[];
    productImagesRepository.save.mockResolvedValue(records as never);

    await expect(
      service.addImages(1, [
        {
          filename: 'one.jpg',
          mimeType: 'image/jpeg',
          size: 100,
          originalName: 'one.jpg',
        },
        {
          filename: 'two.png',
          mimeType: 'image/png',
          size: 200,
          originalName: 'two.png',
        },
      ]),
    ).resolves.toBe(records);
    expect(productImagesRepository.save).toHaveBeenCalledWith([
      expect.objectContaining({ productId: 1, filename: 'one.jpg' }),
      expect.objectContaining({ productId: 1, filename: 'two.png' }),
    ]);
  });

  it('does not return an image belonging to another product', async () => {
    productImagesRepository.findOne.mockResolvedValue(null);

    await expect(service.findImage(1, 9)).rejects.toThrow(
      'Imagem 9 não encontrada no produto 1',
    );
    expect(productImagesRepository.findOne).toHaveBeenCalledWith({
      where: { id: 9, productId: 1 },
    });
  });
});

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PatchProductDto } from './patch-product.dto';
import { ListProductsQueryDto } from './update-product.dto';

describe('product DTOs', () => {
  it('converts price filter query values to numbers', () => {
    const query = plainToInstance(ListProductsQueryDto, {
      q: 'caneca',
      minPrice: '10.5',
      maxPrice: '50',
    });

    expect(query).toMatchObject({
      q: 'caneca',
      minPrice: 10.5,
      maxPrice: 50,
    });
  });

  it('returns custom validation messages for invalid filters', async () => {
    const query = plainToInstance(ListProductsQueryDto, {
      q: 123,
      minPrice: '-1',
    });

    const errors = await validate(query);
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'q',
          constraints: { isString: 'q deve ser um texto' },
        }),
        expect.objectContaining({
          property: 'minPrice',
          constraints: { min: 'minPrice não pode ser negativo' },
        }),
      ]),
    );
  });

  it('keeps PATCH fields optional while validating provided fields', async () => {
    const patch = plainToInstance(
      PatchProductDto,
      { stock: '5' },
      { enableImplicitConversion: true },
    );

    expect(patch.stock).toBe(5);
    expect(await validate(patch)).toHaveLength(0);
  });
});

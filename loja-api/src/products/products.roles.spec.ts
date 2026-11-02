import 'reflect-metadata';
import { ROLES_KEY } from '../auth/roles.decorator';
import { CategoriesController } from '../categories/categories.controller';
import { ProductsController } from './products.controller';

describe('product and category route roles', () => {
  it('allows MANAGER to PUT products but keeps PATCH and DELETE ADMIN-only', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, ProductsController.prototype.update),
    ).toEqual(['ADMIN', 'MANAGER']);
    expect(
      Reflect.getMetadata(ROLES_KEY, ProductsController.prototype.patch),
    ).toEqual(['ADMIN']);
    expect(
      Reflect.getMetadata(ROLES_KEY, ProductsController.prototype.remove),
    ).toEqual(['ADMIN']);
  });

  it('keeps category write routes ADMIN-only', () => {
    for (const route of ['create', 'update', 'remove'] as const) {
      expect(
        Reflect.getMetadata(ROLES_KEY, CategoriesController.prototype[route]),
      ).toEqual(['ADMIN']);
    }
  });

  it('keeps product image upload and delete routes ADMIN-only', () => {
    for (const route of ['uploadImages', 'deleteProductImage'] as const) {
      expect(
        Reflect.getMetadata(ROLES_KEY, ProductsController.prototype[route]),
      ).toEqual(['ADMIN']);
    }
  });
});

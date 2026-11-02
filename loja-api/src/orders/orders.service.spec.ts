jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { Order } from './order.entity';
import { OrdersService } from './orders.service';

describe('OrdersService role access', () => {
  const orderRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  } as unknown as jest.Mocked<Repository<Order>>;
  const productsRepository = {} as Repository<Product>;
  const service = new OrdersService(orderRepository, productsRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lets MANAGER list all orders', async () => {
    const orders = [{ id: 1 }, { id: 2 }] as Order[];
    orderRepository.find.mockResolvedValue(orders);

    await expect(service.findAllForActor(3, 'MANAGER')).resolves.toBe(orders);
    expect(orderRepository.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
    });
  });

  it('lets MANAGER view an order belonging to another user', async () => {
    const order = { id: 1, userId: 99 } as Order;
    orderRepository.findOne.mockResolvedValue(order);

    await expect(service.findOneForActor(1, 3, 'MANAGER')).resolves.toBe(order);
    expect(orderRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('keeps CLIENT order lists scoped to their user', async () => {
    orderRepository.find.mockResolvedValue([]);

    await service.findAllForActor(3, 'CLIENT');

    expect(orderRepository.find).toHaveBeenCalledWith({
      where: { userId: 3 },
      order: { createdAt: 'DESC' },
    });
  });

  it('does not let MANAGER cancel another user order', async () => {
    orderRepository.findOne.mockResolvedValue({ id: 1, userId: 99 } as Order);

    await expect(service.cancelForActor(1, 3, 'MANAGER')).rejects.toThrow(
      'Pedido 1 não encontrado',
    );
    expect(orderRepository.save).not.toHaveBeenCalled();
  });
});

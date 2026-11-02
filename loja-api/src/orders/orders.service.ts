import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './order.entity';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(Product)
        private readonly productsRepository: Repository<Product>,
    ) {}

    async create(dto: CreateOrderDto, userId: number): Promise<Order> {
        const items = await Promise.all(
            dto.items.map(async (item) => {
                const product = await this.productsRepository.findOne({
                    where: { id: item.productId },
                });
                if (!product) {
                    throw new NotFoundException(`Produto ${item.productId} não encontrado`);
                }
                return {
                    productId: product.id,
                    quantity: item.quantity,
                    unityPrice: product.price,
                };
            }),
        );

        const order = this.orderRepository.create({ userId, status: 'OPEN', items });
        return this.orderRepository.save(order);
    }

    findAll(): Promise<Order[]> {
        return this.orderRepository.find({ order: { createdAt: 'DESC' } });
    }

    findAllForUser(userId: number): Promise<Order[]> {
        return this.orderRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    findAllForActor(userId: number, role: string): Promise<Order[]> {
        if (role === 'ADMIN' || role === 'MANAGER') {
            return this.findAll();
        }
        return this.findAllForUser(userId);
    }

    async findOne(id: number): Promise<Order> {
        const order = await this.orderRepository.findOne({ where: { id } });
        if (!order) {
            throw new NotFoundException(`Pedido ${id} não encontrado`);
        }
        return order;
    }

    async findOneForActor(
        id: number,
        userId: number,
        role: string,
    ): Promise<Order> {
        const order = await this.findOne(id);
        if (role !== 'ADMIN' && role !== 'MANAGER' && order.userId !== userId) {
            throw new NotFoundException(`Pedido ${id} não encontrado`);
        }
        return order;
    }

    async cancel(id: number): Promise<Order> {
        const order = await this.findOne(id);
        order.status = 'CANCELLED';
        return this.orderRepository.save(order);
    }

    async cancelForActor(
        id: number,
        userId: number,
        role: string,
    ): Promise<Order> {
        const order = await this.findOne(id);
        if (role !== 'ADMIN' && order.userId !== userId) {
            throw new NotFoundException(`Pedido ${id} não encontrado`);
        }
        return this.cancel(id);
    }
}

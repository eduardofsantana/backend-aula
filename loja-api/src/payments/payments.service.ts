import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Order } from '../orders/order.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async create(userId: number, orderId: number, createPaymentDto: CreatePaymentDto, userRole: string): Promise<Payment> {
    // 1. Verificar se o pedido existe
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Pedido não encontrado.');
    }

    // 2. Verificar se o pedido pertence ao usuário (a menos que seja ADMIN)
    if (userRole !== 'ADMIN' && order.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para pagar este pedido.');
    }

    // 3. O pedido precisa estar OPEN
    if (order.status !== 'OPEN') {
      throw new BadRequestException('Este pedido não está aberto para novos pagamentos.');
    }

    // 4. Verificar se já existe pagamento ativo/pendente para este pedido
    const existingPayment = await this.paymentRepository.findOne({
      where: { orderId, status: 'PENDING' },
    });
    if (existingPayment) {
      throw new BadRequestException('Já existe um pagamento pendente para este pedido.');
    }

    // 5. Criar o pagamento
    const payment = this.paymentRepository.create({
      orderId,
      method: createPaymentDto.method,
      status: 'PENDING',
    });

    return await this.paymentRepository.save(payment);
  }

  async findAll(userId: number, userRole: string, status?: string, orderId?: number): Promise<Payment[]> {
    const query = this.paymentRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order');

    // Se não for ADMIN, restringe estritamente aos pedidos do próprio usuário
    if (userRole !== 'ADMIN') {
      query.where('order.userId = :userId', { userId });
    } else {
      if (orderId) {
        query.andWhere('payment.orderId = :orderId', { orderId });
      }
    }

    if (status) {
      query.andWhere('payment.status = :status', { status });
    }

    return await query.getMany();
  }

  async updateStatus(paymentId: number, newStatus: 'PAID' | 'CANCELLED', userId: number, userRole: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado.');
    }

    // Se não for ADMIN, valida se o usuário logado é o dono do pedido
    if (userRole !== 'ADMIN' && payment.order.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para alterar este pagamento.');
    }

    payment.status = newStatus;
    const updatedPayment = await this.paymentRepository.save(payment);

    // Se o pagamento foi confirmado como PAID, atualiza o status do pedido para PAID
    if (newStatus === 'PAID') {
      payment.order.status = 'PAID';
      await this.orderRepository.save(payment.order);
    }

    return updatedPayment;
  }

  async remove(paymentId: number): Promise<void> {
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });
    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado.');
    }
    await this.paymentRepository.remove(payment);
  }
}
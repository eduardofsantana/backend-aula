import { Order } from 'src/orders/order.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type PaymentMethod = 'CARD' | 'BOLETO' | 'PIX';
export type PaymentStatus = 'PENDING' | 'PAID' | 'CANCELLED';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  orderId: number;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  method: PaymentMethod;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: PaymentStatus;

  @ManyToOne(() => Order, (order) => order.payments)
  order: Order;
}

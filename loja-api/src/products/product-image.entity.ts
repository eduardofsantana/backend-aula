import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_images')
export class ProductImage {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 1 })
  @Column({ type: 'int' })
  productId: number;

  @ApiProperty({ example: '4fd637a8-3754-4f13-9ed5-4e8d55b33c21.webp' })
  @Column({ length: 255 })
  filename: string;

  @ApiProperty({ example: 'image/webp' })
  @Column({ length: 100 })
  mimeType: string;

  @ApiProperty({ example: 24576 })
  @Column({ type: 'int' })
  size: number;

  @ApiProperty({ example: 'caneca.webp' })
  @Column({ length: 255 })
  originalName: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;
}

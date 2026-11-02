import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from '../categories/category.entity';

@Entity('products')
export class Product {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Caneca Nest', maxLength: 255 })
  @Column({ length: 255 })
  name: string;

  @ApiProperty({ example: 39.9, minimum: 0.01 })
  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ example: 10, minimum: 0 })
  @Column({ type: 'int' })
  stock: number;

  @ApiProperty({ example: null, nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  imageFilename: string | null;

  @ApiProperty({ example: 1, nullable: true })
  @Column({ type: 'int', nullable: true })
  categoryId: number | null;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category: Category | null;
}

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  /** CLIENT no register; ADMIN só via seed/SQL — nunca confiar em role no body */
  @Column({ default: 'CLIENT' })
  role: string;
}
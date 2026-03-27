import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 50 })
  category!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  limitAmount!: number;

  @Column({ length: 3, default: 'ARS' })
  currency!: string;

  @Column({ length: 7 })
  month!: string;

  @ManyToOne(() => User, (user) => user.budgets, { onDelete: 'CASCADE' })
  user!: User;
}

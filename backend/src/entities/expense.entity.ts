import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 120 })
  merchant!: string;

  @Column({ type: 'date' })
  expenseDate!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  originalAmount!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amountArs!: number;

  @Column({ length: 3, default: 'ARS' })
  currency!: string;

  @Column({ length: 50 })
  category!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', nullable: true })
  ticketImageUrl!: string | null;

  @Column({ default: 'manual' })
  source!: string;

  @Column({ type: 'jsonb', nullable: true })
  ocrRaw!: Record<string, unknown> | null;

  @ManyToOne(() => User, (user) => user.expenses, { onDelete: 'CASCADE' })
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

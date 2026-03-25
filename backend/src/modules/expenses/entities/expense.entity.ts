import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';

export enum ExpenseType {
  MANUAL = 'manual',
  TICKET = 'ticket',
  TRANSFER = 'transfer',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',
  MOBILE_PAYMENT = 'mobile_payment',
}

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  comercio: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({
    type: 'enum',
    enum: ExpenseType,
    default: ExpenseType.MANUAL,
  })
  tipo: ExpenseType;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CARD,
  })
  metodoPago: PaymentMethod;

  @Column({ type: 'varchar', length: 255, nullable: true })
  urlTicket: string;

  @Column({ type: 'text', nullable: true })
  notasIA: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  confianzaIA: number;

  @Column({ type: 'boolean', default: false })
  esRecurrente: boolean;

  @ManyToOne(() => User, (user) => user.gastos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuarioId' })
  usuario: User;

  @Column({ type: 'uuid' })
  usuarioId: string;

  @ManyToOne(() => Category, (category) => category.gastos, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'categoriaId' })
  categoria: Category;

  @Column({ type: 'uuid', nullable: true })
  categoriaId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

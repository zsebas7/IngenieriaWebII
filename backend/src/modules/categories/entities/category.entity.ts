import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Expense } from '../../expenses/entities/expense.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'varchar', length: 20, default: '#10B981' })
  color: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icono: string;

  @Column({ type: 'boolean', default: true })
  activa: boolean;

  @OneToMany(() => Expense, (expense) => expense.categoria)
  gastos: Expense[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

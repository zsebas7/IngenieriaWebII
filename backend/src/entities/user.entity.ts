import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Role } from '../common/enums/role.enum';
import { Expense } from './expense.entity';
import { Budget } from './budget.entity';
import { Goal } from './goal.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  fullName!: string;

  @Column({ unique: true, length: 120 })
  email!: string;

  @Column({ type: 'text', nullable: true })
  passwordHash!: string | null;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role!: Role;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: 'es' })
  language!: string;

  @Column({ default: 'ARS' })
  preferredCurrency!: string;

  @Column({ type: 'text', nullable: true })
  googleId!: string | null;

  @Column({ type: 'text', nullable: true })
  refreshTokenHash!: string | null;

  @OneToMany(() => Expense, (expense) => expense.user)
  expenses!: Expense[];

  @OneToMany(() => Budget, (budget) => budget.user)
  budgets!: Budget[];

  @OneToMany(() => Goal, (goal) => goal.user)
  goals!: Goal[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @BeforeInsert()
  normalizeEmail() {
    this.email = this.email.toLowerCase().trim();
  }

  async setPassword(password: string) {
    this.passwordHash = await bcrypt.hash(password, 10);
  }
}

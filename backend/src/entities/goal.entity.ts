import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 120 })
  title!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  targetAmount!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  savedAmount!: number;

  @Column({ length: 3, default: 'ARS' })
  currency!: string;

  @Column({ type: 'date' })
  deadline!: string;

  @ManyToOne(() => User, (user) => user.goals, { onDelete: 'CASCADE' })
  user!: User;
}

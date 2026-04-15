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
import { UserSpendingProfile } from '../common/enums/user-spending-profile.enum';
import { Expense } from './expense.entity';
import { Budget } from './budget.entity';
import { Goal } from './goal.entity';
import { AiChatSession } from './ai-chat-session.entity';
import { AiChatMessage } from './ai-chat-message.entity';
import { ChatConversation } from './chat-conversation.entity';
import { ChatMessage } from './chat-message.entity';

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

  @Column({ type: 'enum', enum: UserSpendingProfile, default: UserSpendingProfile.BALANCED })
  spendingProfile!: UserSpendingProfile;

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

  @OneToMany(() => AiChatSession, (session) => session.user)
  aiChatSessions!: AiChatSession[];

  @OneToMany(() => AiChatMessage, (message) => message.user)
  aiChatMessages!: AiChatMessage[];

  @OneToMany(() => ChatConversation, (conversation) => conversation.advisor)
  advisorConversations!: ChatConversation[];

  @OneToMany(() => ChatConversation, (conversation) => conversation.user)
  userConversations!: ChatConversation[];

  @OneToMany(() => ChatMessage, (message) => message.sender)
  advisorChatMessages!: ChatMessage[];

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

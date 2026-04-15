import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { AiChatMessage } from './ai-chat-message.entity';

@Entity('ai_chat_sessions')
export class AiChatSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 120, default: 'Nueva conversación' })
  title!: string;

  @ManyToOne(() => User, (user) => user.aiChatSessions, { onDelete: 'CASCADE' })
  user!: User;

  @OneToMany(() => AiChatMessage, (message) => message.session)
  messages!: AiChatMessage[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

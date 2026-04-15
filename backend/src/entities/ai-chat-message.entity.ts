import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { AiChatSession } from './ai-chat-session.entity';

@Entity('ai_chat_messages')
export class AiChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ length: 20 })
  role!: 'user' | 'assistant';

  @ManyToOne(() => User, (user) => user.aiChatMessages, { onDelete: 'CASCADE' })
  user!: User;

  @ManyToOne(() => AiChatSession, (session) => session.messages, { onDelete: 'CASCADE' })
  session!: AiChatSession;

  @CreateDateColumn()
  createdAt!: Date;
}

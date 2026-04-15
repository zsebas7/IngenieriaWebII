import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ChatMessage } from './chat-message.entity';

export type ChatConversationStatus = 'OPEN' | 'CLOSED';

@Entity('chat_conversations')
export class ChatConversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 120, default: 'Conversación con asesor' })
  title!: string;

  @Column({ length: 12, default: 'OPEN' })
  status!: ChatConversationStatus;

  @Column({ type: 'timestamptz', nullable: true })
  advisorLastReadAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  userLastReadAt!: Date | null;

  @ManyToOne(() => User, (user) => user.advisorConversations, { onDelete: 'CASCADE' })
  advisor!: User;

  @ManyToOne(() => User, (user) => user.userConversations, { onDelete: 'CASCADE' })
  user!: User;

  @OneToMany(() => ChatMessage, (message) => message.conversation)
  messages!: ChatMessage[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

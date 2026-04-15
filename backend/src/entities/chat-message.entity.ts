import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { ChatConversation } from './chat-conversation.entity';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  content!: string;

  @ManyToOne(() => ChatConversation, (conversation) => conversation.messages, { onDelete: 'CASCADE' })
  conversation!: ChatConversation;

  @ManyToOne(() => User, (user) => user.advisorChatMessages, { onDelete: 'CASCADE' })
  sender!: User;

  @CreateDateColumn()
  createdAt!: Date;
}

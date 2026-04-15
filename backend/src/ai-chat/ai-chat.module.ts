import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { AiChatSession } from '../entities/ai-chat-session.entity';
import { AiChatMessage } from '../entities/ai-chat-message.entity';
import { User } from '../entities/user.entity';
import { Expense } from '../entities/expense.entity';
import { Budget } from '../entities/budget.entity';
import { Goal } from '../entities/goal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AiChatSession, AiChatMessage, User, Expense, Budget, Goal])],
  controllers: [AiChatController],
  providers: [AiChatService],
})
export class AiChatModule {}

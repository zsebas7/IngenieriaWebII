import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ExpensesModule } from './expenses/expenses.module';
import { TicketsModule } from './tickets/tickets.module';
import { BudgetsModule } from './budgets/budgets.module';
import { GoalsModule } from './goals/goals.module';
import { DashboardsModule } from './dashboards/dashboards.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { ExportsModule } from './exports/exports.module';
import { ExchangeRateModule } from './exchange-rate/exchange-rate.module';
import { AiChatModule } from './ai-chat/ai-chat.module';
import { ChatModule } from './chat/chat.module';
import { Controller, Get } from '@nestjs/common';

@Controller()
class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'neto-backend' };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ useFactory: typeOrmConfig }),
    AuthModule,
    UsersModule,
    ExpensesModule,
    TicketsModule,
    BudgetsModule,
    GoalsModule,
    DashboardsModule,
    RecommendationsModule,
    ExportsModule,
    ExchangeRateModule,
    AiChatModule,
    ChatModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

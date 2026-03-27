import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardsController } from './dashboards.controller';
import { DashboardsService } from './dashboards.service';
import { Expense } from '../entities/expense.entity';
import { Budget } from '../entities/budget.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Expense, Budget])],
  controllers: [DashboardsController],
  providers: [DashboardsService],
})
export class DashboardsModule {}

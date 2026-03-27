import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { Expense } from '../entities/expense.entity';
import { User } from '../entities/user.entity';
import { ExchangeRateModule } from '../exchange-rate/exchange-rate.module';

@Module({
  imports: [TypeOrmModule.forFeature([Expense, User]), ExchangeRateModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}

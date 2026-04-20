import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../entities/expense.entity';
import { Budget } from '../entities/budget.entity';

@Injectable()
export class DashboardsService {
  constructor(
    @InjectRepository(Expense) private readonly expensesRepository: Repository<Expense>,
    @InjectRepository(Budget) private readonly budgetsRepository: Repository<Budget>,
  ) {}

  async getUserDashboard(userId: string, month: string) {
    const monthExpenses = await this.expensesRepository
      .createQueryBuilder('expense')
      .leftJoin('expense.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere("to_char(expense.expenseDate, 'YYYY-MM') = :month", { month })
      .getMany();

    const total = monthExpenses.reduce((acc, current) => acc + Number(current.amountArs), 0);
    const average = monthExpenses.length ? total / monthExpenses.length : 0;

    const byCategory = monthExpenses.reduce<Record<string, number>>((acc, expense) => {
      acc[expense.category] = (acc[expense.category] ?? 0) + Number(expense.amountArs);
      return acc;
    }, {});

    const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Sin datos';

    const previousMonth = new Date(`${month}-01`);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const previousMonthKey = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`;

    const previousMonthExpenses = await this.expensesRepository
      .createQueryBuilder('expense')
      .leftJoin('expense.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere("to_char(expense.expenseDate, 'YYYY-MM') = :month", { month: previousMonthKey })
      .getMany();

    const previousTotal = previousMonthExpenses
      .reduce((acc, current) => acc + Number(current.amountArs), 0);

    const variationVsLastMonth = previousTotal === 0 ? 0 : ((total - previousTotal) / previousTotal) * 100;

    const budgets = await this.budgetsRepository.find({ where: { user: { id: userId }, month } });

    const budgetProgress = budgets.map((budget) => {
      const used = Number(byCategory[budget.category] ?? 0);
      return {
        category: budget.category,
        limitAmount: Number(budget.limitAmount),
        used,
        progressPercent: budget.limitAmount ? (used / Number(budget.limitAmount)) * 100 : 0,
      };
    });

    return {
      month,
      totalMonthArs: Number(total.toFixed(2)),
      averageExpenseArs: Number(average.toFixed(2)),
      topCategory,
      variationVsLastMonth: Number(variationVsLastMonth.toFixed(2)),
      byCategory,
      budgetProgress,
    };
  }

  async getGlobalStats() {
    const all = await this.expensesRepository.find({ relations: ['user'] });
    const total = all.reduce((acc, current) => acc + Number(current.amountArs), 0);
    const byRole = all.reduce<Record<string, number>>((acc, expense) => {
      const role = expense.user.role;
      acc[role] = (acc[role] ?? 0) + Number(expense.amountArs);
      return acc;
    }, {});

    return {
      totalExpensesArs: Number(total.toFixed(2)),
      transactions: all.length,
      byRole,
    };
  }
}

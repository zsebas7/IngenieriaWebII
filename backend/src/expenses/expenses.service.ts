import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../entities/expense.entity';
import { User } from '../entities/user.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExchangeRateService } from '../exchange-rate/exchange-rate.service';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense) private readonly expensesRepository: Repository<Expense>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly exchangeRateService: ExchangeRateService,
  ) {}

  async create(userId: string, dto: CreateExpenseDto, source = 'manual', ocrRaw?: Record<string, unknown>) {
    const user = await this.usersRepository.findOneByOrFail({ id: userId });
    const amountArs = await this.exchangeRateService.convertToArs(dto.originalAmount, dto.currency);

    const expense = this.expensesRepository.create({
      ...dto,
      amountArs,
      source,
      user,
      description: dto.description ?? null,
      ocrRaw: ocrRaw ?? null,
      ticketImageUrl: null,
    });

    return this.expensesRepository.save(expense);
  }

  async findAll(userId: string, role: string, query: { month?: string; category?: string }) {
    const qb = this.expensesRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.user', 'user')
      .orderBy('expense.expenseDate', 'DESC');

    if (role !== 'ADMIN' && role !== 'ADVISOR') {
      qb.where('user.id = :userId', { userId });
    }

    if (query.month) {
      qb.andWhere("to_char(expense.expenseDate, 'YYYY-MM') = :month", { month: query.month });
    }

    if (query.category) {
      qb.andWhere('expense.category = :category', { category: query.category });
    }

    return qb.getMany();
  }

  async findOneForUser(id: string, userId: string, role: string) {
    const expense = await this.expensesRepository.findOne({ where: { id }, relations: ['user'] });
    if (!expense) {
      throw new NotFoundException('Gasto no encontrado');
    }

    if (role === 'USER' && expense.user.id !== userId) {
      throw new NotFoundException('Gasto no encontrado');
    }

    return expense;
  }

  async update(id: string, userId: string, role: string, dto: UpdateExpenseDto) {
    const expense = await this.findOneForUser(id, userId, role);

    Object.assign(expense, dto);
    if (dto.originalAmount || dto.currency) {
      const amount = Number(dto.originalAmount ?? expense.originalAmount);
      const currency = dto.currency ?? expense.currency;
      expense.amountArs = await this.exchangeRateService.convertToArs(amount, currency);
    }

    return this.expensesRepository.save(expense);
  }

  async remove(id: string, userId: string, role: string) {
    const expense = await this.findOneForUser(id, userId, role);
    await this.expensesRepository.delete(expense.id);
    return { success: true };
  }
}

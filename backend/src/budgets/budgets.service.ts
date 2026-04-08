import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from '../entities/budget.entity';
import { User } from '../entities/user.entity';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget) private readonly budgetsRepository: Repository<Budget>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  async create(userId: string, dto: CreateBudgetDto) {
    const user = await this.usersRepository.findOneByOrFail({ id: userId });
    const budget = this.budgetsRepository.create({ ...dto, user });
    return this.budgetsRepository.save(budget);
  }

  findMine(userId: string) {
    return this.budgetsRepository.find({
      where: { user: { id: userId } },
      order: { month: 'DESC' },
    });
  }

  async update(userId: string, budgetId: string, dto: UpdateBudgetDto) {
    const budget = await this.budgetsRepository.findOne({
      where: { id: budgetId, user: { id: userId } },
    });

    if (!budget) {
      throw new NotFoundException('Presupuesto no encontrado.');
    }

    Object.assign(budget, dto);
    return this.budgetsRepository.save(budget);
  }

  async remove(userId: string, budgetId: string) {
    const budget = await this.budgetsRepository.findOne({
      where: { id: budgetId, user: { id: userId } },
    });

    if (!budget) {
      throw new NotFoundException('Presupuesto no encontrado.');
    }

    await this.budgetsRepository.remove(budget);
    return { success: true };
  }
}

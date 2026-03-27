import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from '../entities/budget.entity';
import { User } from '../entities/user.entity';
import { CreateBudgetDto } from './dto/create-budget.dto';

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
}

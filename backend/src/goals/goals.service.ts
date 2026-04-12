import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from '../entities/goal.entity';
import { User } from '../entities/user.entity';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(Goal) private readonly goalsRepository: Repository<Goal>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  async create(userId: string, dto: CreateGoalDto) {
    const user = await this.usersRepository.findOneByOrFail({ id: userId });
    const goal = this.goalsRepository.create({ ...dto, savedAmount: 0, user });
    return this.goalsRepository.save(goal);
  }

  findMine(userId: string) {
    return this.goalsRepository.find({
      where: { user: { id: userId } },
      order: { deadline: 'ASC' },
    });
  }

  async update(userId: string, goalId: string, dto: UpdateGoalDto) {
    const goal = await this.goalsRepository.findOne({
      where: { id: goalId, user: { id: userId } },
    });

    if (!goal) {
      throw new NotFoundException('Meta no encontrada.');
    }

    Object.assign(goal, dto);
    return this.goalsRepository.save(goal);
  }

  async addSavings(userId: string, goalId: string, amount: number) {
    const goal = await this.goalsRepository.findOne({
      where: { id: goalId, user: { id: userId } },
    });

    if (!goal) {
      throw new NotFoundException('Meta no encontrada.');
    }

    const currentSaved = Number(goal.savedAmount || 0);
    goal.savedAmount = currentSaved + Number(amount || 0);
    return this.goalsRepository.save(goal);
  }

  async remove(userId: string, goalId: string) {
    const goal = await this.goalsRepository.findOne({
      where: { id: goalId, user: { id: userId } },
    });

    if (!goal) {
      throw new NotFoundException('Meta no encontrada.');
    }

    await this.goalsRepository.remove(goal);
    return { success: true };
  }
}

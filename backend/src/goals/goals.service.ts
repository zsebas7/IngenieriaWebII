import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from '../entities/goal.entity';
import { User } from '../entities/user.entity';
import { CreateGoalDto } from './dto/create-goal.dto';

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
}

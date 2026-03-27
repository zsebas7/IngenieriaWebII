import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly usersRepository: Repository<User>) {}

  findAll() {
    return this.usersRepository.find({
      select: ['id', 'fullName', 'email', 'role', 'isActive', 'createdAt', 'language', 'preferredCurrency'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async updateMe(id: string, dto: UpdateProfileDto) {
    await this.usersRepository.update(id, dto);
    return this.findById(id);
  }

  async setActive(id: string, isActive: boolean) {
    await this.usersRepository.update(id, { isActive });
    return this.findById(id);
  }

  async setRole(id: string, role: Role) {
    await this.usersRepository.update(id, { role });
    return this.findById(id);
  }
}

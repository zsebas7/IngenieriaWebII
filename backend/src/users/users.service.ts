import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Role } from '../common/enums/role.enum';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcryptjs';

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

  async changeMyPassword(id: string, dto: ChangePasswordDto) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('Tu cuenta no tiene contraseña local configurada');
    }

    const match = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException('La contraseña actual no es correcta');
    }

    await user.setPassword(dto.newPassword);
    await this.usersRepository.save(user);

    return { message: 'Contraseña actualizada correctamente' };
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

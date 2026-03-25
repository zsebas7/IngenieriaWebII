import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import {
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
} from './dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const user = this.usersRepository.create(createUserDto);
    await this.usersRepository.save(user);
    delete user.password;
    return user;
  }

  async findAll(): Promise<User[]> {
    const users = await this.usersRepository.find({
      select: [
        'id',
        'nombre',
        'email',
        'telefono',
        'rol',
        'activo',
        'presupuestoMensual',
        'createdAt',
        'updatedAt',
      ],
    });
    return users;
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['gastos'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    delete user.password;
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt();
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    Object.assign(user, updateUserDto);
    await this.usersRepository.save(user);
    delete user.password;
    return user;
  }

  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isPasswordValid = await user.validatePassword(
      changePasswordDto.passwordActual,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Contraseña actual incorrecta');
    }

    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(changePasswordDto.passwordNueva, salt);
    await this.usersRepository.save(user);

    return { message: 'Contraseña actualizada exitosamente' };
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.findByEmail(email);

    if (!user || !user.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    delete user.password;
    return user;
  }

  async remove(id: string): Promise<{ message: string }> {
    const user = await this.findById(id);
    await this.usersRepository.remove(user);
    return { message: 'Usuario eliminado exitosamente' };
  }

  async deactivateUser(id: string): Promise<User> {
    const user = await this.findById(id);
    user.activo = false;
    await this.usersRepository.save(user);
    delete user.password;
    return user;
  }

  async activateUser(id: string): Promise<User> {
    const user = await this.findById(id);
    user.activo = true;
    await this.usersRepository.save(user);
    delete user.password;
    return user;
  }
}

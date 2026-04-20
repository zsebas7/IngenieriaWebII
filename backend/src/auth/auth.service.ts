import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(this.configService.get<string>('GOOGLE_CLIENT_ID'));
  }

  async register(dto: RegisterDto) {
    const exists = await this.usersRepository.findOne({ where: { email: dto.email.toLowerCase() } });
    if (exists) {
      throw new UnauthorizedException('Email ya registrado');
    }

    const user = this.usersRepository.create({
      fullName: dto.fullName,
      email: dto.email.toLowerCase(),
      role: dto.role ?? Role.USER,
    });

    await user.setPassword(dto.password);
    await this.usersRepository.save(user);

    return this.signTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findOne({ where: { email: dto.email.toLowerCase() } });
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const match = await bcrypt.compare(dto.password, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario desactivado');
    }

    return this.signTokens(user);
  }

  async loginWithGoogle(dto: GoogleLoginDto) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: dto.idToken,
      audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw new UnauthorizedException('Token de Google inválido');
    }

    let user = await this.usersRepository.findOne({ where: { email: payload.email.toLowerCase() } });

    if (!user) {
      user = this.usersRepository.create({
        fullName: payload.name ?? payload.email,
        email: payload.email.toLowerCase(),
        googleId: payload.sub,
        role: Role.USER,
      });
      await this.usersRepository.save(user);
    }

    return this.signTokens(user);
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const ok = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!ok) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    return this.signTokens(user);
  }

  async forgotPassword(email: string) {
    const user = await this.usersRepository.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return { message: 'Si el correo existe, enviaremos instrucciones.' };
    }

    return {
      message: 'Flujo base listo. Integra SMTP o proveedor transaccional para producción.',
    };
  }

  private async signTokens(user: User) {
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: '30m',
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '30d',
      },
    );

    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.usersRepository.save(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        language: user.language,
        preferredCurrency: user.preferredCurrency,
      },
    };
  }
}

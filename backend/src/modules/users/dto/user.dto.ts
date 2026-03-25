import { IsEmail, IsString, MinLength, IsPhoneNumber, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  nombre: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber()
  telefono: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  @IsOptional()
  rol?: UserRole;

  @IsNumber()
  @IsOptional()
  presupuestoMensual?: number;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsPhoneNumber()
  @IsOptional()
  telefono?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsNumber()
  @IsOptional()
  presupuestoMensual?: number;

  @IsString()
  @IsOptional()
  perfilFinanciero?: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  passwordActual: string;

  @IsString()
  @MinLength(6)
  passwordNueva: string;
}

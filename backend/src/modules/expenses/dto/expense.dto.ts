import {
  IsString,
  IsNumber,
  IsDate,
  IsEnum,
  IsOptional,
  IsUUID,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExpenseType, PaymentMethod } from '../entities/expense.entity';

export class CreateExpenseDto {
  @IsString()
  comercio: string;

  @IsNumber()
  @Min(0)
  monto: number;

  @IsDate()
  @Type(() => Date)
  fecha: Date;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsEnum(ExpenseType)
  @IsOptional()
  tipo?: ExpenseType;

  @IsEnum(PaymentMethod)
  @IsOptional()
  metodoPago?: PaymentMethod;

  @IsUUID()
  @IsOptional()
  categoriaId?: string;

  @IsString()
  @IsOptional()
  urlTicket?: string;

  @IsBoolean()
  @IsOptional()
  esRecurrente?: boolean;
}

export class UpdateExpenseDto {
  @IsString()
  @IsOptional()
  comercio?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  monto?: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  fecha?: Date;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsEnum(ExpenseType)
  @IsOptional()
  tipo?: ExpenseType;

  @IsEnum(PaymentMethod)
  @IsOptional()
  metodoPago?: PaymentMethod;

  @IsUUID()
  @IsOptional()
  categoriaId?: string;

  @IsBoolean()
  @IsOptional()
  esRecurrente?: boolean;
}

export class ExpenseFilterDto {
  @IsOptional()
  @Type(() => Date)
  fechaDesde?: Date;

  @IsOptional()
  @Type(() => Date)
  fechaHasta?: Date;

  @IsUUID()
  @IsOptional()
  categoriaId?: string;

  @IsEnum(PaymentMethod)
  @IsOptional()
  metodoPago?: PaymentMethod;
}

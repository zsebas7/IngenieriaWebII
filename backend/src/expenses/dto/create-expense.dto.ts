import { IsDateString, IsIn, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  merchant!: string;

  @IsDateString()
  expenseDate!: string;

  @IsNumber()
  @Min(0.01)
  originalAmount!: number;

  @IsIn(['ARS', 'USD', 'EUR'])
  currency!: string;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsObject()
  ocrRaw?: Record<string, unknown>;
}

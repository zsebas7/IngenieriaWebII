import { IsDateString, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

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
}

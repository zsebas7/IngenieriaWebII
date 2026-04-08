import { IsIn, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';

export class UpdateBudgetDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limitAmount?: number;

  @IsOptional()
  @IsIn(['ARS', 'USD', 'EUR'])
  currency?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/)
  month?: string;
}

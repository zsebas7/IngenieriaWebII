import { IsIn, IsString, Matches, Min, IsNumber } from 'class-validator';

export class CreateBudgetDto {
  @IsString()
  category!: string;

  @IsNumber()
  @Min(1)
  limitAmount!: number;

  @IsIn(['ARS', 'USD', 'EUR'])
  currency!: string;

  @Matches(/^\d{4}-\d{2}$/)
  month!: string;
}

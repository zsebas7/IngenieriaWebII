import { IsDateString, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateGoalDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  targetAmount?: number;

  @IsOptional()
  @IsIn(['ARS', 'USD', 'EUR'])
  currency?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}
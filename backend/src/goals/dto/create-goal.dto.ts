import { IsDateString, IsIn, IsNumber, IsString, Min } from 'class-validator';

export class CreateGoalDto {
  @IsString()
  title!: string;

  @IsNumber()
  @Min(1)
  targetAmount!: number;

  @IsIn(['ARS', 'USD', 'EUR'])
  currency!: string;

  @IsDateString()
  deadline!: string;
}

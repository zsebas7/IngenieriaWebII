import { IsNumber, Min } from 'class-validator';

export class AddGoalSavingsDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;
}
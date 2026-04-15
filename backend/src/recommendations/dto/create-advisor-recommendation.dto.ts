import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAdvisorRecommendationDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1500)
  content!: string;
}

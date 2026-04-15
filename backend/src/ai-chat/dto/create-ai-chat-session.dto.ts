import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAiChatSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;
}

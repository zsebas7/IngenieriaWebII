import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class OpenConversationDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;
}

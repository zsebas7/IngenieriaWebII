import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsIn(['es', 'en'])
  language?: string;

  @IsOptional()
  @IsIn(['ARS', 'USD', 'EUR'])
  preferredCurrency?: string;
}

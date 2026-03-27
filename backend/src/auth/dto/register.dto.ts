import { IsEmail, IsIn, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class RegisterDto {
  @IsString()
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'La contraseña debe tener al menos una mayúscula y un número',
  })
  password!: string;

  @IsOptional()
  @IsIn([Role.USER, Role.ADVISOR])
  role?: Role;
}

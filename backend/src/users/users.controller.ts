import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@Req() req: { user: { id: string } }) {
    return this.usersService.findMeById(req.user.id);
  }

  @Patch('me')
  updateMe(@Req() req: { user: { id: string } }, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateMe(req.user.id, dto);
  }

  @Patch('me/password')
  changeMyPassword(@Req() req: { user: { id: string } }, @Body() dto: ChangePasswordDto) {
    return this.usersService.changeMyPassword(req.user.id, dto);
  }

  @Roles(Role.ADMIN, Role.ADVISOR)
  @Get()
  listUsers() {
    return this.usersService.findAll();
  }

  @Roles(Role.ADMIN)
  @Patch(':id/active')
  toggleActive(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.usersService.setActive(id, body.isActive);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/role')
  setRole(@Param('id') id: string, @Body() body: { role: Role }) {
    return this.usersService.setRole(id, body.role);
  }
}

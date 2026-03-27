import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DashboardsService } from './dashboards.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Get('me')
  me(@Req() req: { user: { id: string } }, @Query('month') month?: string) {
    const currentMonth = month ?? new Date().toISOString().slice(0, 7);
    return this.dashboardsService.getUserDashboard(req.user.id, currentMonth);
  }

  @Roles(Role.ADMIN)
  @Get('global')
  global() {
    return this.dashboardsService.getGlobalStats();
  }
}

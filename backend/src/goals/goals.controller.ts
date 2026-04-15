import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { AddGoalSavingsDto } from './dto/add-goal-savings.dto';

@UseGuards(JwtAuthGuard)
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  create(@Req() req: { user: { id: string } }, @Body() dto: CreateGoalDto) {
    return this.goalsService.create(req.user.id, dto);
  }

  @Get()
  list(@Req() req: { user: { id: string } }) {
    return this.goalsService.findMine(req.user.id);
  }

  @Patch(':id')
  update(@Req() req: { user: { id: string } }, @Param('id') id: string, @Body() dto: UpdateGoalDto) {
    return this.goalsService.update(req.user.id, id, dto);
  }

  @Post(':id/savings')
  addSavings(@Req() req: { user: { id: string } }, @Param('id') id: string, @Body() dto: AddGoalSavingsDto) {
    return this.goalsService.addSavings(req.user.id, id, dto.amount);
  }

  @Post(':id/withdrawals')
  withdrawSavings(@Req() req: { user: { id: string } }, @Param('id') id: string, @Body() dto: AddGoalSavingsDto) {
    return this.goalsService.withdrawSavings(req.user.id, id, dto.amount);
  }

  @Delete(':id')
  remove(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.goalsService.remove(req.user.id, id);
  }
}

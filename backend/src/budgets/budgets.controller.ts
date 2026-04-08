import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  create(@Req() req: { user: { id: string } }, @Body() dto: CreateBudgetDto) {
    return this.budgetsService.create(req.user.id, dto);
  }

  @Get()
  list(@Req() req: { user: { id: string } }) {
    return this.budgetsService.findMine(req.user.id);
  }

  @Patch(':id')
  update(@Req() req: { user: { id: string } }, @Param('id') id: string, @Body() dto: UpdateBudgetDto) {
    return this.budgetsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.budgetsService.remove(req.user.id, id);
  }
}

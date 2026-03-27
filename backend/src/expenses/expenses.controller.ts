import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  findAll(
    @Req() req: { user: { id: string; role: string } },
    @Query('month') month?: string,
    @Query('category') category?: string,
  ) {
    return this.expensesService.findAll(req.user.id, req.user.role, { month, category });
  }

  @Post()
  create(@Req() req: { user: { id: string } }, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(req.user.id, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() req: { user: { id: string; role: string } },
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(id, req.user.id, req.user.role, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: { id: string; role: string } }) {
    return this.expensesService.remove(id, req.user.id, req.user.role);
  }
}

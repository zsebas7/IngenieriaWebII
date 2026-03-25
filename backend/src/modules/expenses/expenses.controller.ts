import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseFilterDto,
} from './dto/expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Post()
  async create(@Request() req, @Body() createExpenseDto: CreateExpenseDto) {
    return this.expensesService.create(req.user.id, createExpenseDto);
  }

  @Get()
  async findAll(@Request() req) {
    return this.expensesService.findAllByUser(req.user.id);
  }

  @Get('stats/summary')
  async getStats(
    @Request() req,
    @Query('mes') mes?: number,
    @Query('año') año?: number,
  ) {
    return this.expensesService.getExpenseStats(req.user.id, mes, año);
  }

  @Get('recurring')
  async getRecurring(@Request() req) {
    return this.expensesService.getRecurringExpenses(req.user.id);
  }

  @Post('filter')
  async filterExpenses(@Request() req, @Body() filterDto: ExpenseFilterDto) {
    return this.expensesService.filterExpenses(req.user.id, filterDto);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.expensesService.findById(id, req.user.id);
  }

  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(id, req.user.id, updateExpenseDto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.expensesService.remove(id, req.user.id);
  }
}

import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { CreateExpenseDto, UpdateExpenseDto, ExpenseFilterDto } from './dto/expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expensesRepository: Repository<Expense>,
  ) {}

  async create(usuarioId: string, createExpenseDto: CreateExpenseDto): Promise<Expense> {
    const expense = this.expensesRepository.create({
      ...createExpenseDto,
      usuarioId,
    });

    return this.expensesRepository.save(expense);
  }

  async findAllByUser(usuarioId: string): Promise<Expense[]> {
    return this.expensesRepository.find({
      where: { usuarioId },
      relations: ['categoria'],
      order: { fecha: 'DESC' },
    });
  }

  async findById(id: string, usuarioId: string): Promise<Expense> {
    const expense = await this.expensesRepository.findOne({
      where: { id, usuarioId },
      relations: ['categoria'],
    });

    if (!expense) {
      throw new NotFoundException('Gasto no encontrado');
    }

    return expense;
  }

  async update(
    id: string,
    usuarioId: string,
    updateExpenseDto: UpdateExpenseDto,
  ): Promise<Expense> {
    const expense = await this.findById(id, usuarioId);
    Object.assign(expense, updateExpenseDto);
    return this.expensesRepository.save(expense);
  }

  async remove(id: string, usuarioId: string): Promise<{ message: string }> {
    const expense = await this.findById(id, usuarioId);
    await this.expensesRepository.remove(expense);
    return { message: 'Gasto eliminado exitosamente' };
  }

  async filterExpenses(
    usuarioId: string,
    filterDto: ExpenseFilterDto,
  ): Promise<Expense[]> {
    const query = this.expensesRepository.createQueryBuilder('expense');

    query.where('expense.usuarioId = :usuarioId', { usuarioId });

    if (filterDto.fechaDesde && filterDto.fechaHasta) {
      query.andWhere('expense.fecha BETWEEN :fechaDesde AND :fechaHasta', {
        fechaDesde: filterDto.fechaDesde,
        fechaHasta: filterDto.fechaHasta,
      });
    }

    if (filterDto.categoriaId) {
      query.andWhere('expense.categoriaId = :categoriaId', {
        categoriaId: filterDto.categoriaId,
      });
    }

    if (filterDto.metodoPago) {
      query.andWhere('expense.metodoPago = :metodoPago', {
        metodoPago: filterDto.metodoPago,
      });
    }

    query.leftJoinAndSelect('expense.categoria', 'categoria');
    query.orderBy('expense.fecha', 'DESC');

    return query.getMany();
  }

  async getExpenseStats(usuarioId: string, mes?: number, año?: number) {
    const query = this.expensesRepository.createQueryBuilder('expense');

    query.where('expense.usuarioId = :usuarioId', { usuarioId });

    if (mes && año) {
      const inicio = new Date(año, mes - 1, 1);
      const fin = new Date(año, mes, 0);
      query.andWhere('expense.fecha BETWEEN :inicio AND :fin', {
        inicio,
        fin,
      });
    }

    const gastos = await query.getMany();

    const total = gastos.reduce((sum, g) => sum + parseFloat(g.monto.toString()), 0);
    const promedio = gastos.length > 0 ? total / gastos.length : 0;

    const porCategoria = {};
    gastos.forEach((g) => {
      const cat = g.categoria?.nombre || 'Sin categoría';
      porCategoria[cat] = (porCategoria[cat] || 0) + parseFloat(g.monto.toString());
    });

    return {
      total,
      cantidad: gastos.length,
      promedio: Math.round(promedio * 100) / 100,
      gastoMayor: gastos.length > 0 ? Math.max(...gastos.map(g => Number(g.monto))) : 0,
      gastoMenor: gastos.length > 0 ? Math.min(...gastos.map(g => Number(g.monto))) : 0,
      porCategoria,
    };
  }

  async getRecurringExpenses(usuarioId: string): Promise<Expense[]> {
    return this.expensesRepository.find({
      where: { usuarioId, esRecurrente: true },
      relations: ['categoria'],
      order: { fecha: 'DESC' },
    });
  }
}

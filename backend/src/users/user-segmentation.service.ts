import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../entities/expense.entity';
import { User } from '../entities/user.entity';
import { UserSpendingProfile } from '../common/enums/user-spending-profile.enum';

const DISCRETIONARY_KEYWORDS = [
  'entretenimiento',
  'otros',
  'ocio',
  'salidas',
  'restaurante',
  'delivery',
  'comida rapida',
  'streaming',
  'suscripcion',
  'shopping',
  'ropa',
  'moda',
  'viaje',
  'turismo',
  'tecnologia',
  'electro',
  'juegos',
  'gimnasio',
  'mascota',
  'regalos',
  'belleza',
  'cosmetica',
  'hogar decoracion',
];

const ESSENTIAL_KEYWORDS = [
  'supermercado',
  'almacen',
  'comida',
  'farmacia',
  'salud',
  'medico',
  'transporte',
  'combustible',
  'servicios',
  'luz',
  'agua',
  'gas',
  'internet',
  'telefono',
  'alquiler',
  'expensas',
  'educacion',
  'colegio',
  'seguro',
  'impuestos',
];

const SAVER_THRESHOLD = 0.35;
const SPENDER_THRESHOLD = 0.5;

@Injectable()
export class UserSegmentationService {
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async refreshForUser(userId: string) {
    const expenses = await this.getLast30DaysExpenses(userId);
    const nextProfile = this.computeProfile(expenses);

    await this.usersRepository.update(userId, { spendingProfile: nextProfile });
    return nextProfile;
  }

  private async getLast30DaysExpenses(userId: string) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 30);
    const since = sinceDate.toISOString().slice(0, 10);

    return this.expensesRepository
      .createQueryBuilder('expense')
      .leftJoin('expense.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('expense.expenseDate >= :since', { since })
      .getMany();
  }

  private computeProfile(expenses: Expense[]) {
    if (!expenses.length) {
      return UserSpendingProfile.BALANCED;
    }

    let discretionaryTotal = 0;
    let essentialTotal = 0;

    for (const expense of expenses) {
      const amount = Number(expense.amountArs || 0);
      if (amount <= 0) {
        continue;
      }

      const kind = this.classifyCategory(expense.category);
      if (kind === 'discretionary') {
        discretionaryTotal += amount;
      } else {
        essentialTotal += amount;
      }
    }

    const total = discretionaryTotal + essentialTotal;
    if (total <= 0) {
      return UserSpendingProfile.BALANCED;
    }

    const discretionaryRatio = discretionaryTotal / total;

    if (discretionaryRatio <= SAVER_THRESHOLD) {
      return UserSpendingProfile.SAVER;
    }

    if (discretionaryRatio >= SPENDER_THRESHOLD) {
      return UserSpendingProfile.SPENDER;
    }

    return UserSpendingProfile.BALANCED;
  }

  private classifyCategory(category: string) {
    const normalized = this.normalize(category);

    if (DISCRETIONARY_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
      return 'discretionary';
    }

    if (ESSENTIAL_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
      return 'essential';
    }

    return 'essential';
  }

  private normalize(value: string) {
    return (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}

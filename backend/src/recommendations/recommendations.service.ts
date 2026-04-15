import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import axios from 'axios';
import { Recommendation } from '../entities/recommendation.entity';
import { Expense } from '../entities/expense.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectRepository(Recommendation)
    private readonly recommendationsRepository: Repository<Recommendation>,
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async generateForUser(userId: string) {
    const user = await this.usersRepository.findOneByOrFail({ id: userId });
    const expenses = await this.expensesRepository.find({ where: { user: { id: userId } } });

    const month = new Date().toISOString().slice(0, 7);
    const currentMonth = expenses.filter((expense) => expense.expenseDate.startsWith(month));
    const summary = currentMonth.map((expense) => ({
      merchant: expense.merchant,
      category: expense.category,
      amountArs: Number(expense.amountArs),
    }));

    const content = await this.generateWithOpenAi(summary);

    const recommendation = this.recommendationsRepository.create({
      user,
      source: 'llm',
      content,
    });

    return this.recommendationsRepository.save(recommendation);
  }

  listForUser(userId: string) {
    return this.recommendationsRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  listAdvisorForUser(userId: string) {
    return this.recommendationsRepository.find({
      where: {
        user: { id: userId },
        source: Like('advisor:%'),
      },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async createAdvisorRecommendation(advisorId: string, userId: string, content: string) {
    const [advisor, user] = await Promise.all([
      this.usersRepository.findOne({ where: { id: advisorId }, select: ['id', 'fullName'] }),
      this.usersRepository.findOneBy({ id: userId }),
    ]);

    if (!advisor) {
      throw new NotFoundException('Asesor no encontrado');
    }

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const recommendation = this.recommendationsRepository.create({
      user,
      source: `advisor:${advisor.fullName}`,
      content,
    });

    return this.recommendationsRepository.save(recommendation);
  }

  async removeAdvisorRecommendation(recommendationId: string) {
    const recommendation = await this.recommendationsRepository.findOne({
      where: { id: recommendationId },
    });

    if (!recommendation || !String(recommendation.source || '').startsWith('advisor:')) {
      throw new NotFoundException('Recomendación de asesor no encontrada');
    }

    await this.recommendationsRepository.remove(recommendation);
    return { success: true };
  }

  private async generateWithOpenAi(summary: Array<{ merchant: string; category: string; amountArs: number }>) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || summary.length === 0) {
      return this.buildRuleBasedRecommendation(summary);
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'Eres un asesor financiero. Responde en español con 3 recomendaciones cortas y accionables.',
            },
            {
              role: 'user',
              content: `Analiza estos gastos en ARS y sugiere mejoras: ${JSON.stringify(summary).slice(0, 5000)}`,
            },
          ],
          temperature: 0.4,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      return response.data?.choices?.[0]?.message?.content ?? this.buildRuleBasedRecommendation(summary);
    } catch {
      return this.buildRuleBasedRecommendation(summary);
    }
  }

  private buildRuleBasedRecommendation(summary: Array<{ merchant: string; category: string; amountArs: number }>) {
    if (summary.length === 0) {
      return 'Aun no hay gastos cargados. Registra tus tickets para recibir recomendaciones personalizadas.';
    }

    const byCategory = summary.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + item.amountArs;
      return acc;
    }, {});

    const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

    if (!topCategory) {
      return 'Mantiene un seguimiento constante de tus gastos para detectar oportunidades de ahorro.';
    }

    return `Tu categoría con mayor gasto es ${topCategory[0]} (${topCategory[1].toFixed(
      2,
    )} ARS). Define un presupuesto mensual para esa categoría, evita compras impulsivas y revisa comercios alternativos con mejores precios.`;
  }
}

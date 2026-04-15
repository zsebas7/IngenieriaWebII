import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { AiChatSession } from '../entities/ai-chat-session.entity';
import { AiChatMessage } from '../entities/ai-chat-message.entity';
import { User } from '../entities/user.entity';
import { Expense } from '../entities/expense.entity';
import { Budget } from '../entities/budget.entity';
import { Goal } from '../entities/goal.entity';

@Injectable()
export class AiChatService {
  private static readonly HIDDEN_SYSTEM_PROMPT =
    'Usted es NETO Advisor, un asesor financiero digital formal y claro. Siempre responde en español formal, con frases concretas y accionables. Use el contexto financiero provisto para personalizar cada respuesta.';
  private readonly logger = new Logger(AiChatService.name);

  constructor(
    @InjectRepository(AiChatSession)
    private readonly sessionRepository: Repository<AiChatSession>,
    @InjectRepository(AiChatMessage)
    private readonly messageRepository: Repository<AiChatMessage>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    @InjectRepository(Budget)
    private readonly budgetsRepository: Repository<Budget>,
    @InjectRepository(Goal)
    private readonly goalsRepository: Repository<Goal>,
  ) {}

  async listSessions(userId: string) {
    const sessions = await this.sessionRepository.find({
      where: { user: { id: userId } },
      order: { updatedAt: 'DESC' },
    });

    return Promise.all(
      sessions.map(async (session) => {
        const lastMessage = await this.messageRepository.findOne({
          where: { session: { id: session.id } },
          order: { createdAt: 'DESC' },
        });

        return {
          id: session.id,
          title: session.title,
          updatedAt: session.updatedAt,
          lastMessage: lastMessage?.content ?? null,
        };
      }),
    );
  }

  async createSession(userId: string, title?: string) {
    const user = await this.usersRepository.findOneByOrFail({ id: userId });
    const session = this.sessionRepository.create({
      user,
      title: title?.trim() || 'Nueva conversación',
    });
    return this.sessionRepository.save(session);
  }

  async removeSession(userId: string, sessionId: string) {
    const session = await this.findSessionOrFail(userId, sessionId);
    await this.sessionRepository.remove(session);
    return { success: true };
  }

  async listMessages(userId: string, sessionId: string) {
    await this.findSessionOrFail(userId, sessionId);

    return this.messageRepository.find({
      where: { session: { id: sessionId } },
      order: { createdAt: 'ASC' },
    });
  }

  async sendMessage(userId: string, sessionId: string, userMessageText: string) {
    const session = await this.findSessionOrFail(userId, sessionId);
    const user = await this.usersRepository.findOneByOrFail({ id: userId });

    const trimmedMessage = userMessageText.trim();

    const userMessage = this.messageRepository.create({
      content: trimmedMessage,
      role: 'user',
      user,
      session,
    });
    await this.messageRepository.save(userMessage);

    if (session.title === 'Nueva conversación') {
      session.title = this.buildSessionTitle(trimmedMessage);
      await this.sessionRepository.save(session);
    }

    const context = await this.buildFinancialContext(userId);
    const history = await this.messageRepository.find({
      where: { session: { id: sessionId } },
      order: { createdAt: 'ASC' },
      take: 20,
    });

    const assistantResult = await this.generateAssistantResponse(context, history);

    const assistantMessage = this.messageRepository.create({
      content: assistantResult.text,
      role: 'assistant',
      user,
      session,
    });
    await this.messageRepository.save(assistantMessage);

    return {
      session: {
        id: session.id,
        title: session.title,
        updatedAt: new Date(),
      },
      userMessage,
      assistantMessage,
      provider: assistantResult.provider,
    };
  }

  private async findSessionOrFail(userId: string, sessionId: string) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, user: { id: userId } },
      relations: ['user'],
    });

    if (!session) {
      throw new NotFoundException('Conversación no encontrada');
    }

    return session;
  }

  private buildSessionTitle(message: string) {
    const compact = message.replace(/\s+/g, ' ').trim();
    if (compact.length <= 48) {
      return compact;
    }
    return `${compact.slice(0, 45)}...`;
  }

  private async buildFinancialContext(userId: string) {
    const today = new Date().toISOString().slice(0, 10);

    const [user, expenses, budgets, goals] = await Promise.all([
      this.usersRepository.findOneByOrFail({ id: userId }),
      this.expensesRepository.find({ where: { user: { id: userId } }, order: { expenseDate: 'DESC' }, take: 60 }),
      this.budgetsRepository.find({ where: { user: { id: userId } }, take: 20 }),
      this.goalsRepository.find({
        where: { user: { id: userId } },
        order: { deadline: 'ASC' },
        take: 40,
      }),
    ]);

    const totalArs = expenses.reduce((acc, item) => acc + Number(item.amountArs || 0), 0);
    const byCategory = expenses.reduce<Record<string, number>>((acc, item) => {
      const category = item.category || 'Otros';
      acc[category] = (acc[category] ?? 0) + Number(item.amountArs || 0);
      return acc;
    }, {});

    const sortedCategories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount: Number(amount.toFixed(2)) }));

    const normalizedGoals = goals.map((item) => ({
      title: item.title,
      targetAmount: Number(item.targetAmount),
      savedAmount: Number(item.savedAmount),
      currency: item.currency,
      deadline: item.deadline,
    }));

    const activeGoals = normalizedGoals.filter((item) => item.deadline >= today);
    const expiredGoals = normalizedGoals.filter((item) => item.deadline < today);
    const recentlyExpiredGoals = expiredGoals.filter((item) => this.daysSinceDate(item.deadline) <= 3);

    return {
      user: {
        fullName: user.fullName,
        preferredCurrency: user.preferredCurrency,
        spendingProfile: user.spendingProfile,
      },
      totals: {
        expensesCount: expenses.length,
        totalArs: Number(totalArs.toFixed(2)),
      },
      topCategories: sortedCategories,
      budgets: budgets.map((item) => ({
        category: item.category,
        month: item.month,
        limitAmount: Number(item.limitAmount),
        currency: item.currency,
      })),
      goals: activeGoals,
      expiredGoals,
      recentlyExpiredGoals,
    };
  }

  private async generateAssistantResponse(
    context: {
      user: { fullName: string; preferredCurrency: string; spendingProfile: string };
      totals: { expensesCount: number; totalArs: number };
      topCategories: Array<{ category: string; amount: number }>;
      budgets: Array<{ category: string; month: string; limitAmount: number; currency: string }>;
      goals: Array<{ title: string; targetAmount: number; savedAmount: number; currency: string; deadline: string }>;
      expiredGoals: Array<{
        title: string;
        targetAmount: number;
        savedAmount: number;
        currency: string;
        deadline: string;
      }>;
      recentlyExpiredGoals: Array<{
        title: string;
        targetAmount: number;
        savedAmount: number;
        currency: string;
        deadline: string;
      }>;
    },
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<{ text: string; provider: 'groq' | 'openai' | 'rule-based' | 'small-talk' }> {
    const userPrompt = history.filter((item) => item.role === 'user').slice(-1)[0]?.content || '';

    if (this.isSmallTalkPrompt(userPrompt)) {
      return { text: this.buildSmallTalkReply(userPrompt), provider: 'small-talk' };
    }

    if (this.isActiveGoalsPrompt(userPrompt)) {
      return { text: this.buildActiveGoalsReply(context), provider: 'rule-based' };
    }

    const allowRecommendations = this.hasRecommendationIntent(userPrompt);
    const llmContext = this.buildLlmContext(context, userPrompt);

    const groqApiKey = process.env.GROQ_API_KEY;
    if (groqApiKey) {
      const fromGroq = await this.generateWithGroq(groqApiKey, llmContext, history, allowRecommendations);
      if (fromGroq) return { text: fromGroq, provider: 'groq' };
    }

    const openAiApiKey = process.env.OPENAI_API_KEY;
    if (openAiApiKey) {
      const fromOpenAi = await this.generateWithOpenAi(openAiApiKey, llmContext, history, allowRecommendations);
      if (fromOpenAi) return { text: fromOpenAi, provider: 'openai' };
    }

    return {
      text: this.buildRuleBasedReply(context, userPrompt, allowRecommendations),
      provider: 'rule-based',
    };
  }

  private hasRecommendationIntent(prompt: string) {
    const text = String(prompt || '').toLowerCase();
    return /recomend|aconsej|que hago|qué hago|me conviene|plan de ahorro|presupuesto|mejorar|optimizar|reducir/i.test(
      text,
    );
  }

  private isActiveGoalsPrompt(prompt: string) {
    const text = String(prompt || '').toLowerCase();
    if (/expirad|vencid/i.test(text)) {
      return false;
    }
    return /meta|metas|ahorro|objetiv/i.test(text) && /activ/i.test(text);
  }

  private isGoalsPrompt(prompt: string) {
    const text = String(prompt || '').toLowerCase();
    return /meta|metas|ahorro|objetiv|expirad|vencid|activ/i.test(text);
  }

  private buildLlmContext(
    context: {
      user: { fullName: string; preferredCurrency: string; spendingProfile: string };
      totals: { expensesCount: number; totalArs: number };
      topCategories: Array<{ category: string; amount: number }>;
      budgets: Array<{ category: string; month: string; limitAmount: number; currency: string }>;
      goals: Array<{ title: string; targetAmount: number; savedAmount: number; currency: string; deadline: string }>;
      expiredGoals: Array<{
        title: string;
        targetAmount: number;
        savedAmount: number;
        currency: string;
        deadline: string;
      }>;
      recentlyExpiredGoals: Array<{
        title: string;
        targetAmount: number;
        savedAmount: number;
        currency: string;
        deadline: string;
      }>;
    },
    prompt: string,
  ) {
    if (this.isGoalsPrompt(prompt)) {
      return {
        ...context,
        topCategories: context.topCategories.slice(0, 3),
        budgets: context.budgets.slice(0, 6),
        goals: context.goals.slice(0, 12),
        expiredGoals: context.expiredGoals.slice(0, 12),
        recentlyExpiredGoals: context.recentlyExpiredGoals.slice(0, 6),
      };
    }

    return {
      ...context,
      topCategories: context.topCategories.slice(0, 5),
      budgets: context.budgets.slice(0, 10),
      goals: context.goals.slice(0, 10),
      expiredGoals: context.expiredGoals.slice(0, 8),
      recentlyExpiredGoals: context.recentlyExpiredGoals.slice(0, 5),
    };
  }

  private logProviderError(provider: 'groq' | 'openai', error: unknown) {
    if (!axios.isAxiosError(error)) {
      this.logger.warn(`AI provider ${provider} failed with non-Axios error.`);
      return;
    }

    const status = error.response?.status ?? 'no-status';
    const detail =
      (typeof error.response?.data === 'string' ? error.response.data : JSON.stringify(error.response?.data || {})) ||
      error.message ||
      'sin detalle';

    this.logger.warn(`AI provider ${provider} failed. status=${status} detail=${detail.slice(0, 280)}`);
  }

  private buildPolicyPrompt(allowRecommendations: boolean) {
    if (allowRecommendations) {
      return 'El usuario sí pidió consejo/recomendación explícita. Puede recomendar con fundamento en los datos.';
    }
    return 'El usuario NO pidió recomendaciones explícitas. Limítese a análisis y respuesta puntual. No proponga planes ni recomendaciones salvo solicitud explícita. Si el mensaje es social (ejemplo: hola, gracias), responda socialmente sin forzar análisis financiero.';
  }

  private isSmallTalkPrompt(prompt: string) {
    const normalized = String(prompt || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!normalized) return true;

    return /^(hola|holi|hey|buenas|buen dia|buenas tardes|buenas noches|como va|que tal|gracias|ok|dale|genial)$/.test(
      normalized,
    );
  }

  private buildSmallTalkReply(prompt: string) {
    const normalized = String(prompt || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (/^(ok|dale|genial)$/.test(normalized)) {
      return 'Perfecto. Cuando quiera, puedo revisar su gasto por categoría, presupuesto o metas activas.';
    }

    if (/^gracias$/.test(normalized)) {
      return 'Con gusto. Si desea, continúo con el análisis que necesite.';
    }

    return 'Hola. Estoy disponible para ayudarle con su análisis financiero. Puede indicarme, por ejemplo, si desea revisar su categoría de mayor gasto, su presupuesto mensual o el avance de sus metas.';
  }

  private async generateWithGroq(
    groqApiKey: string,
    context: {
      user: { fullName: string; preferredCurrency: string; spendingProfile: string };
      totals: { expensesCount: number; totalArs: number };
      topCategories: Array<{ category: string; amount: number }>;
      budgets: Array<{ category: string; month: string; limitAmount: number; currency: string }>;
      goals: Array<{ title: string; targetAmount: number; savedAmount: number; currency: string; deadline: string }>;
      expiredGoals: Array<{
        title: string;
        targetAmount: number;
        savedAmount: number;
        currency: string;
        deadline: string;
      }>;
      recentlyExpiredGoals: Array<{
        title: string;
        targetAmount: number;
        savedAmount: number;
        currency: string;
        deadline: string;
      }>;
    },
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    allowRecommendations: boolean,
  ) {
    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: AiChatService.HIDDEN_SYSTEM_PROMPT },
            { role: 'system', content: this.buildPolicyPrompt(allowRecommendations) },
            { role: 'system', content: `Contexto financiero actualizado: ${JSON.stringify(context).slice(0, 6000)}` },
            ...history.map((item) => ({ role: item.role, content: item.content })),
          ],
          temperature: 0.25,
        },
        {
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const content = response.data?.choices?.[0]?.message?.content;
      return typeof content === 'string' && content.trim() ? content : null;
    } catch (error) {
      this.logProviderError('groq', error);
      return null;
    }
  }

  private async generateWithOpenAi(
    apiKey: string,
    context: {
      user: { fullName: string; preferredCurrency: string; spendingProfile: string };
      totals: { expensesCount: number; totalArs: number };
      topCategories: Array<{ category: string; amount: number }>;
      budgets: Array<{ category: string; month: string; limitAmount: number; currency: string }>;
      goals: Array<{ title: string; targetAmount: number; savedAmount: number; currency: string; deadline: string }>;
      expiredGoals: Array<{
        title: string;
        targetAmount: number;
        savedAmount: number;
        currency: string;
        deadline: string;
      }>;
      recentlyExpiredGoals: Array<{
        title: string;
        targetAmount: number;
        savedAmount: number;
        currency: string;
        deadline: string;
      }>;
    },
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    allowRecommendations: boolean,
  ) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
          messages: [
            { role: 'system', content: AiChatService.HIDDEN_SYSTEM_PROMPT },
            { role: 'system', content: this.buildPolicyPrompt(allowRecommendations) },
            { role: 'system', content: `Contexto financiero actualizado: ${JSON.stringify(context).slice(0, 6000)}` },
            ...history.map((item) => ({ role: item.role, content: item.content })),
          ],
          temperature: 0.25,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const content = response.data?.choices?.[0]?.message?.content;
      return typeof content === 'string' && content.trim() ? content : null;
    } catch (error) {
      this.logProviderError('openai', error);
      return null;
    }
  }

  private buildActiveGoalsReply(context: {
    goals: Array<{ title: string; targetAmount: number; savedAmount: number; currency: string; deadline: string }>;
    recentlyExpiredGoals: Array<{
      title: string;
      targetAmount: number;
      savedAmount: number;
      currency: string;
      deadline: string;
    }>;
  }) {
    const activeCount = context.goals.length;
    const base = `Metas activas: ${activeCount}.`;

    if (!context.recentlyExpiredGoals.length) {
      return base;
    }

    const recentTitles = context.recentlyExpiredGoals
      .slice(0, 3)
      .map((goal) => goal.title)
      .join(', ');

    return `${base} Además, ${context.recentlyExpiredGoals.length} meta(s) se vencieron en los últimos 3 días: ${recentTitles}.`;
  }

  private daysSinceDate(dateValue: string) {
    const date = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return Number.POSITIVE_INFINITY;
    }

    const now = new Date();
    const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const utcTarget = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.floor((utcNow - utcTarget) / 86400000);
  }

  private buildRuleBasedReply(
    context: {
      totals: { expensesCount: number; totalArs: number };
      topCategories: Array<{ category: string; amount: number }>;
      goals: Array<{ title: string; targetAmount: number; savedAmount: number; currency: string; deadline: string }>;
      expiredGoals: Array<{
        title: string;
        targetAmount: number;
        savedAmount: number;
        currency: string;
        deadline: string;
      }>;
      recentlyExpiredGoals: Array<{
        title: string;
        targetAmount: number;
        savedAmount: number;
        currency: string;
        deadline: string;
      }>;
    },
    prompt: string,
    allowRecommendations: boolean,
  ) {
    if (/expirad|vencid/i.test(prompt)) {
      if (!context.expiredGoals.length) {
        return 'No registra metas de ahorro expiradas.';
      }

      const topExpired = context.expiredGoals
        .slice(0, 3)
        .map((goal) => {
          const progress = goal.targetAmount > 0 ? (goal.savedAmount / goal.targetAmount) * 100 : 0;
          return `${goal.title} (venció el ${goal.deadline}, avance ${progress.toFixed(1)}%)`;
        })
        .join('; ');

      return `Registra ${context.expiredGoals.length} metas expiradas: ${topExpired}.`;
    }

    if (context.totals.expensesCount === 0) {
      return 'No observo gastos suficientes para analizar en detalle. Cuando cargue algunos movimientos, podré responder con mayor precisión.';
    }

    const top = context.topCategories[0];
    const base = top
      ? `Su categoría con mayor gasto es ${top.category} (${top.amount.toFixed(2)} ARS).`
      : `Tiene ${context.totals.expensesCount} gastos y ${context.totals.totalArs.toFixed(2)} ARS registrados.`;

    if (!allowRecommendations) {
      if (/categoria|categoría/i.test(prompt)) {
        return `${base} Si desea, puedo convertir este diagnóstico en recomendaciones puntuales.`;
      }
      return `${base} Puedo ampliar el análisis por mes, comercio o presupuesto si lo solicita.`;
    }

    const hasGoals = context.goals.length > 0;
    const goalHint = hasGoals
      ? ' Como ya tiene metas activas, conviene asignar un tope semanal y derivar excedentes a ahorro.'
      : ' Si aún no tiene metas, conviene crear una meta mensual para medir el avance de ahorro.';

    return `${base} Recomendación: reduzca un gasto no esencial por semana en esa categoría y compare precios entre comercios.${goalHint}`;
  }
}

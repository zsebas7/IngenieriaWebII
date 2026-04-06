import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import axios from 'axios';
import * as FormData from 'form-data';
import { ExpensesService } from '../expenses/expenses.service';

@Injectable()
export class TicketsService {
  constructor(private readonly expensesService: ExpensesService) {}

  private static readonly TRANSIENT_RETRY_DELAYS_MS = [1500, 3000];

  private static readonly OCR_ATTEMPTS: ReadonlyArray<{ language: string; isTable: boolean; engine: number }> = [
    { language: 'spa', isTable: true, engine: 2 },
    { language: 'spa', isTable: false, engine: 2 },
    { language: 'eng', isTable: false, engine: 2 },
    { language: 'spa', isTable: false, engine: 1 },
  ];

  async uploadAndProcess(file: Express.Multer.File, userId: string) {
    try {
      if (!file) {
        throw new BadRequestException('Debe adjuntar un archivo');
      }

      const parsed = await this.processWithOcrSpace(file);
      if (!parsed) {
        throw new BadRequestException('No se pudo extraer información confiable del ticket');
      }

      return this.expensesService.create(
        userId,
        {
          merchant: parsed.merchant,
          expenseDate: parsed.date,
          originalAmount: parsed.amount,
          currency: parsed.currency,
          category: parsed.category,
          description: 'Gasto detectado automáticamente por OCR',
        },
        'ocr',
        parsed.raw,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const detail = error instanceof Error ? error.message : 'Error interno inesperado';
      throw new BadRequestException(`No se pudo procesar el ticket: ${detail}`);
    }
  }

  private async processWithOcrSpace(file: Express.Multer.File) {
    const apiKey = process.env.OCR_SPACE_API_KEY;
    if (!apiKey) {
      throw new BadRequestException('OCR_SPACE_API_KEY no configurada');
    }

    let lastOcrError: string | null = null;

    const rounds = TicketsService.TRANSIENT_RETRY_DELAYS_MS.length + 1;
    for (let round = 0; round < rounds; round += 1) {
      let sawTransientError = false;

      for (const attempt of TicketsService.OCR_ATTEMPTS) {
        const response = await this.callOcrSpace(apiKey, file, attempt.language, attempt.isTable, attempt.engine);
        const result = this.tryParseOcrResponse(response.data);

        if (result.parsed) {
          return result.parsed;
        }

        if (result.errorMessage) {
          lastOcrError = result.errorMessage;
          if (this.isTransientOcrError(result.errorMessage)) {
            sawTransientError = true;
          }
        }
      }

      const hasAnotherRound = round < rounds - 1;
      if (sawTransientError && hasAnotherRound) {
        await this.sleep(TicketsService.TRANSIENT_RETRY_DELAYS_MS[round]);
      }
    }

    if (lastOcrError) {
      if (this.isTransientOcrError(lastOcrError)) {
        throw new BadRequestException('OCR temporalmente saturado. Reintente en 1-2 minutos.');
      }

      throw new BadRequestException(`OCR falló: ${lastOcrError}`);
    }

    return null;
  }

  private async callOcrSpace(
    apiKey: string,
    file: Express.Multer.File,
    language: string,
    isTable: boolean,
    engine: number,
  ) {
    const formData = new FormData();
    formData.append('apikey', apiKey);
    formData.append('language', language);
    formData.append('isTable', String(isTable));
    formData.append('scale', 'true');
    formData.append('OCREngine', String(engine));
    formData.append('file', file.buffer, file.originalname);

    try {
      return await axios.post('https://api.ocr.space/parse/image', formData, {
        headers: formData.getHeaders(),
        timeout: 30000,
      });
    } catch {
      throw new BadRequestException('No se pudo conectar al servicio OCR. Reintente en unos minutos.');
    }
  }

  private tryParseOcrResponse(ocrData: unknown) {
    const data = ocrData as {
      OCRExitCode?: number | string;
      ErrorMessage?: string | string[];
      ParsedResults?: Array<{ ParsedText?: string }>;
    };

    const ocrExitCode = Number(data?.OCRExitCode ?? 0);
    if (ocrExitCode !== 1) {
      const rawError = data?.ErrorMessage?.[0] || data?.ErrorMessage || 'OCR.Space no pudo interpretar el archivo';
      const errorMessage = Array.isArray(rawError) ? rawError.join(' | ') : String(rawError);
      return { parsed: null, errorMessage };
    }

    const rawText = data?.ParsedResults?.[0]?.ParsedText;
    if (!rawText) {
      return { parsed: null, errorMessage: null };
    }

    const lines = String(rawText)
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return { parsed: null, errorMessage: null };
    }

    const amount = this.extractAmount(rawText, lines);
    if (!amount) {
      return { parsed: null, errorMessage: null };
    }

    const currency = this.extractCurrency(rawText);

    const rawDate = this.extractDate(rawText);
    const formattedDate = rawDate ? this.normalizeDate(rawDate) : null;
    if (!formattedDate) {
      return { parsed: null, errorMessage: null };
    }

    const merchant = this.extractMerchant(rawText, lines);
    const text = rawText.toLowerCase();
    const category =
      text.includes('super') || text.includes('market')
        ? 'Supermercado'
        : text.includes('farm')
          ? 'Salud'
          : text.includes('taxi') || text.includes('uber')
            ? 'Transporte'
            : 'Otros';

    return {
      parsed: {
        amount,
        date: formattedDate,
        merchant,
        currency,
        category,
        raw: data,
      },
      errorMessage: null,
    };
  }

  private isTransientOcrError(message: string): boolean {
    return /e500|system resource exhaustion|ocr binary failed|timed out|timeout/i.test(message);
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private extractAmount(rawText: string, lines: string[]): number | null {
    const totalLike = /\b(t[o0]ta[l1i!]?|importe|a\s*pagar|total\s*a\s*pagar)\b/i;
    const subtotalLike = /\bsub\s*t[o0]ta[l1i!]?\b/i;
    const vatLike = /\b(i\s*va|iva|impuesto)\b/i;
    const headerLike = /\b(descrip|descripcion|cant(?:idad)?|unidad|precio)\b/i;

    const subtotal = this.findAmountByKeyword(lines, subtotalLike);
    const vat = this.findAmountByKeyword(lines, vatLike);
    const expectedTotal = subtotal !== null && vat !== null ? subtotal + vat : null;

    const candidates: Array<{ amount: number; score: number; index: number }> = [];

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (subtotalLike.test(line)) {
        continue;
      }

      if (!totalLike.test(line)) {
        continue;
      }

      const values = this.extractAmountsFromText(line, { allowInteger: false });
      if (values.length > 0) {
        let score = 3;
        if (/\b(a\s*pagar|importe|total\s*:)/i.test(line)) {
          score += 2;
        }
        if (index >= Math.floor(lines.length * 0.6)) {
          score += 2;
        }
        if (headerLike.test(line)) {
          score -= 3;
        }

        const amount = values[values.length - 1];
        if (expectedTotal !== null) {
          const delta = Math.abs(amount - expectedTotal);
          if (delta <= 0.2) {
            score += 4;
          } else if (delta <= 1) {
            score += 2;
          } else if (delta <= 3) {
            score += 1;
          }
        }

        candidates.push({ amount, score, index });
      } else if (index + 1 < lines.length) {
        const nextValues = this.extractAmountsFromText(lines[index + 1], { allowInteger: false });
        if (nextValues.length > 0) {
          candidates.push({ amount: nextValues[nextValues.length - 1], score: 2, index: index + 1 });
        }
      }
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score || b.index - a.index);
      return candidates[0].amount;
    }

    const startIndex = Math.floor(lines.length * 0.5);
    const fallbackValues = lines
      .slice(startIndex)
      .flatMap((line) => this.extractAmountsFromText(line, { allowInteger: false }));

    if (fallbackValues.length > 0) {
      return Math.max(...fallbackValues);
    }

    const allValues = this.extractAmountsFromText(rawText, { allowInteger: false });
    if (allValues.length === 0) {
      return null;
    }

    return Math.max(...allValues);
  }

  private findAmountByKeyword(lines: string[], keyword: RegExp): number | null {
    for (const line of lines) {
      if (!keyword.test(line)) {
        continue;
      }

      const values = this.extractAmountsFromText(line, { allowInteger: false });
      if (values.length > 0) {
        return values[values.length - 1];
      }
    }

    return null;
  }

  private extractAmountsFromText(text: string, options?: { allowInteger?: boolean }): number[] {
    const decimalPattern = /\d{1,3}(?:[\.\s]\d{3})*(?:[\.,]\d{2})|\d+(?:[\.,]\d{2})/g;
    const integerPattern = /\b\d{1,6}\b/g;

    const decimalMatches = text.match(decimalPattern) ?? [];
    const integerMatches = options?.allowInteger ? text.match(integerPattern) ?? [] : [];
    const matches = [...decimalMatches, ...integerMatches];

    return matches
      .map((value) => this.parseAmount(value))
      .filter((value): value is number => value !== null && value > 0 && value < 10_000_000)
      .filter((value) => value >= 1);
  }

  private parseAmount(raw: string): number | null {
    const compact = raw.replace(/\s+/g, '');
    if (!compact) {
      return null;
    }

    const lastComma = compact.lastIndexOf(',');
    const lastDot = compact.lastIndexOf('.');
    let normalized = compact;

    if (lastComma !== -1 && lastDot !== -1) {
      if (lastComma > lastDot) {
        normalized = compact.replace(/\./g, '').replace(',', '.');
      } else {
        normalized = compact.replace(/,/g, '');
      }
    } else if (lastComma !== -1) {
      normalized = compact.replace(',', '.');
    }

    const amount = Number(normalized);
    return Number.isFinite(amount) ? amount : null;
  }

  private extractDate(rawText: string): string | null {
    const normalized = rawText.replace(/[|]/g, '/');
    const patterns = [
      /fecha\s*[:\-]?\s*(\d{1,2}\s*[\/\.\-\s]\s*\d{1,2}\s*[\/\.\-\s]\s*\d{2,4})/i,
      /(\d{1,2}\s*[\/\.\-\s]\s*\d{1,2}\s*[\/\.\-\s]\s*\d{2,4})/,
      /(\d{4}\s*[\/\.\-]\s*\d{1,2}\s*[\/\.\-]\s*\d{1,2})/,
    ];

    for (const pattern of patterns) {
      const match = normalized.match(pattern);
      if (match?.[1]) {
        return match[1].replace(/\s+/g, '');
      }
    }

    return null;
  }

  private extractCurrency(rawText: string): 'ARS' | 'USD' | 'EUR' {
    const text = rawText.toLowerCase();
    if (text.includes('eur') || text.includes('€')) {
      return 'EUR';
    }

    if (text.includes('usd') || text.includes('u$s')) {
      return 'USD';
    }

    return 'ARS';
  }

  private extractMerchant(rawText: string, lines: string[]): string {
    const thanksMatch = rawText.match(/gracias\s+por\s+su\s+compra\s+en\s+([^\n]+)/i);
    if (thanksMatch?.[1]) {
      return thanksMatch[1].replace(/[^a-zA-Z0-9&.'\-\s]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
    }

    const notMerchantLike =
      /(centro comercial|av\.?|avenida|calle|ticket|fecha|hora|caja|empleado|descripcion|cant|subtotal|iva|total|forma de pago|gracias)/i;

    const topLines = lines.slice(0, 8);
    const brandLike = topLines.find((line) => {
      const cleaned = line.replace(/\s+/g, ' ').trim();
      if (!cleaned || notMerchantLike.test(cleaned)) {
        return false;
      }

      if (/\d/.test(cleaned)) {
        return false;
      }

      return cleaned.length >= 2 && cleaned.length <= 40;
    });

    if (brandLike) {
      return brandLike.replace(/\s+/g, ' ').trim().slice(0, 120);
    }

    const candidate = lines.find((line) => /[a-zA-Z]/.test(line) && !notMerchantLike.test(line)) ?? lines[0] ?? 'Comercio';
    return candidate.replace(/\s+/g, ' ').trim().slice(0, 120);
  }

  private normalizeDate(rawDate: string): string | null {
    const parts = rawDate.split(/[\/\.\-\s]+/).map((value) => value.trim()).filter(Boolean);
    if (parts.length !== 3) {
      return null;
    }

    let dayRaw = parts[0];
    let monthRaw = parts[1];
    let yearRaw = parts[2];

    // Support yyyy-mm-dd style by swapping when year comes first.
    if (dayRaw.length === 4) {
      yearRaw = parts[0];
      monthRaw = parts[1];
      dayRaw = parts[2];
    }

    const day = Number(dayRaw);
    const month = Number(monthRaw);
    const year = Number(yearRaw.length === 2 ? `20${yearRaw}` : yearRaw);

    if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
      return null;
    }

    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2000 || year > 2100) {
      return null;
    }

    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      return null;
    }

    const yyyy = String(year);
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}

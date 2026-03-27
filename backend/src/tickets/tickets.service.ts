import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';
import { ExpensesService } from '../expenses/expenses.service';

@Injectable()
export class TicketsService {
  constructor(private readonly expensesService: ExpensesService) {}

  async uploadAndProcess(file: Express.Multer.File, userId: string) {
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
  }

  private async processWithOcrSpace(file: Express.Multer.File) {
    const apiKey = process.env.OCR_SPACE_API_KEY;
    if (!apiKey) {
      throw new BadRequestException('OCR_SPACE_API_KEY no configurada');
    }

    const formData = new FormData();
    formData.append('apikey', apiKey);
    formData.append('language', 'spa');
    formData.append('isTable', 'true');
    formData.append('scale', 'true');
    formData.append('file', file.buffer, file.originalname);

    const response = await axios.post('https://api.ocr.space/parse/image', formData, {
      headers: formData.getHeaders(),
      timeout: 30000,
    });

    const rawText = response.data?.ParsedResults?.[0]?.ParsedText;
    if (!rawText) {
      return null;
    }

    const lines = String(rawText)
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    const amountMatch = rawText.match(/(\$|USD|EUR|ARS)?\s?([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,][0-9]{2})?)/);
    const dateMatch = rawText.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{2,4})/);

    if (!amountMatch || !dateMatch || lines.length === 0) {
      return null;
    }

    const amount = Number(amountMatch[2].replace(/\./g, '').replace(',', '.'));
    if (Number.isNaN(amount) || amount <= 0) {
      return null;
    }

    const currencyRaw = (amountMatch[1] ?? 'ARS').toUpperCase().replace('$', 'ARS');
    const currency = ['ARS', 'USD', 'EUR'].includes(currencyRaw) ? currencyRaw : 'ARS';

    const [day, month, year] = dateMatch[1].split(/[\/-]/);
    const fullYear = year.length === 2 ? `20${year}` : year;
    const formattedDate = `${fullYear}-${month}-${day}`;

    const merchant = lines[0].slice(0, 120);
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
      amount,
      date: formattedDate,
      merchant,
      currency,
      category,
      raw: response.data,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';
import { Expense } from '../entities/expense.entity';

@Injectable()
export class ExportsService {
  constructor(@InjectRepository(Expense) private readonly expensesRepository: Repository<Expense>) {}

  async buildCsv(userId: string) {
    const expenses = await this.expensesRepository.find({ where: { user: { id: userId } } });
    const parser = new Parser({
      fields: ['expenseDate', 'merchant', 'category', 'currency', 'originalAmount', 'amountArs', 'description'],
    });

    return parser.parse(expenses);
  }

  async buildXlsx(userId: string) {
    const expenses = await this.expensesRepository.find({ where: { user: { id: userId } } });
    const worksheet = XLSX.utils.json_to_sheet(expenses);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Gastos');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async buildPdf(userId: string) {
    const expenses = await this.expensesRepository.find({ where: { user: { id: userId } } });

    return new Promise<Buffer>((resolve) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(18).text('Reporte de Gastos - NETO');
      doc.moveDown();

      expenses.forEach((expense) => {
        doc
          .fontSize(11)
          .text(
            `${expense.expenseDate} | ${expense.merchant} | ${expense.category} | ${expense.currency} ${expense.originalAmount} | ARS ${expense.amountArs}`,
          );
      });

      doc.end();
    });
  }
}

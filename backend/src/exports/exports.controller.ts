import { Controller, Get, Header, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ExportsService } from './exports.service';

@UseGuards(JwtAuthGuard)
@Controller('exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('csv')
  @Header('Content-Type', 'text/csv')
  async csv(@Req() req: { user: { id: string } }) {
    return this.exportsService.buildCsv(req.user.id);
  }

  @Get('xlsx')
  async xlsx(@Req() req: { user: { id: string } }, @Res() res: Response) {
    const buffer = await this.exportsService.buildXlsx(req.user.id);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="gastos.xlsx"');
    res.send(buffer);
  }

  @Get('pdf')
  async pdf(@Req() req: { user: { id: string } }, @Res() res: Response) {
    const buffer = await this.exportsService.buildPdf(req.user.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="gastos.pdf"');
    res.send(buffer);
  }
}

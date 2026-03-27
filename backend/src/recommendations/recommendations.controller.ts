import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RecommendationsService } from './recommendations.service';

@UseGuards(JwtAuthGuard)
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Post('generate')
  generate(@Req() req: { user: { id: string } }) {
    return this.recommendationsService.generateForUser(req.user.id);
  }

  @Get()
  list(@Req() req: { user: { id: string } }) {
    return this.recommendationsService.listForUser(req.user.id);
  }
}

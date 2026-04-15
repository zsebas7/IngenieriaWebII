import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RecommendationsService } from './recommendations.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CreateAdvisorRecommendationDto } from './dto/create-advisor-recommendation.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
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

  @Roles(Role.ADVISOR, Role.ADMIN)
  @Get('user/:userId')
  listAdvisorForUser(@Param('userId') userId: string) {
    return this.recommendationsService.listAdvisorForUser(userId);
  }

  @Roles(Role.ADVISOR, Role.ADMIN)
  @Post('advisor')
  createAdvisorRecommendation(
    @Req() req: { user: { id: string } },
    @Body() dto: CreateAdvisorRecommendationDto,
  ) {
    return this.recommendationsService.createAdvisorRecommendation(req.user.id, dto.userId, dto.content);
  }

  @Roles(Role.ADVISOR, Role.ADMIN)
  @Delete(':id')
  removeAdvisorRecommendation(@Param('id') id: string) {
    return this.recommendationsService.removeAdvisorRecommendation(id);
  }
}

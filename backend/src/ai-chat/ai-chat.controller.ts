import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AiChatService } from './ai-chat.service';
import { CreateAiChatSessionDto } from './dto/create-ai-chat-session.dto';
import { SendAiChatMessageDto } from './dto/send-ai-chat-message.dto';

@UseGuards(JwtAuthGuard)
@Controller('ai-chat')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Get('sessions')
  listSessions(@Req() req: { user: { id: string } }) {
    return this.aiChatService.listSessions(req.user.id);
  }

  @Post('sessions')
  createSession(@Req() req: { user: { id: string } }, @Body() dto: CreateAiChatSessionDto) {
    return this.aiChatService.createSession(req.user.id, dto.title);
  }

  @Delete('sessions/:sessionId')
  removeSession(@Req() req: { user: { id: string } }, @Param('sessionId') sessionId: string) {
    return this.aiChatService.removeSession(req.user.id, sessionId);
  }

  @Get('sessions/:sessionId/messages')
  listMessages(@Req() req: { user: { id: string } }, @Param('sessionId') sessionId: string) {
    return this.aiChatService.listMessages(req.user.id, sessionId);
  }

  @Post('sessions/:sessionId/messages')
  sendMessage(
    @Req() req: { user: { id: string } },
    @Param('sessionId') sessionId: string,
    @Body() dto: SendAiChatMessageDto,
  ) {
    return this.aiChatService.sendMessage(req.user.id, sessionId, dto.message);
  }
}

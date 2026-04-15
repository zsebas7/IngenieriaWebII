import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ChatService } from './chat.service';
import { OpenConversationDto } from './dto/open-conversation.dto';
import { SendChatMessageDto } from './dto/send-chat-message.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  listConversations(@Req() req: { user: { id: string; role: string } }) {
    return this.chatService.listConversations(req.user.id, req.user.role);
  }

  @Roles(Role.ADVISOR)
  @Post('conversations/open')
  openConversation(@Req() req: { user: { id: string } }, @Body() dto: OpenConversationDto) {
    return this.chatService.openConversation(req.user.id, dto);
  }

  @Roles(Role.ADVISOR)
  @Patch('conversations/:conversationId/close')
  closeConversation(@Req() req: { user: { id: string } }, @Param('conversationId') conversationId: string) {
    return this.chatService.closeConversation(req.user.id, conversationId);
  }

  @Get('conversations/:conversationId/messages')
  listMessages(@Req() req: { user: { id: string; role: string } }, @Param('conversationId') conversationId: string) {
    return this.chatService.listMessages(req.user.id, req.user.role, conversationId);
  }

  @Post('conversations/:conversationId/messages')
  sendMessage(
    @Req() req: { user: { id: string; role: string } },
    @Param('conversationId') conversationId: string,
    @Body() dto: SendChatMessageDto,
  ) {
    return this.chatService.sendMessage(req.user.id, req.user.role, conversationId, dto.content);
  }
}

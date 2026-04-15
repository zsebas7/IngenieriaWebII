import { IsUUID } from 'class-validator';

export class WsJoinConversationDto {
  @IsUUID()
  conversationId!: string;
}

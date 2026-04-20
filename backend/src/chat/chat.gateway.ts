import {
  ConnectedSocket,
  OnGatewayDisconnect,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { WsJoinConversationDto } from './dto/ws-join-conversation.dto';
import { WsSendMessageDto } from './dto/ws-send-message.dto';

type SocketUser = { id: string; role: string };

const parseAllowedOrigins = (rawValue: string): string[] =>
  rawValue
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly onlineUsers = new Map<string, number>();
  private readonly allowedOrigins: string[];
  private readonly allowAllOrigins: boolean;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly chatService: ChatService,
  ) {
    const rawCorsOrigins =
      this.configService.get<string>('CORS_ORIGIN') ?? this.configService.get<string>('FRONTEND_URL', '');
    this.allowedOrigins = parseAllowedOrigins(rawCorsOrigins);
    this.allowAllOrigins = this.allowedOrigins.includes('*');
  }

  async handleConnection(client: Socket) {
    const origin = String(client.handshake.headers.origin || '').trim();
    if (!this.isOriginAllowed(origin)) {
      client.disconnect();
      return;
    }

    const user = await this.resolveUserFromSocket(client);
    if (!user) {
      client.disconnect();
      return;
    }

    client.data.user = user;
    this.markUserOnline(user.id);
    await this.emitPresenceForUserConversations(user.id, user.role, true);
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user as SocketUser | undefined;
    if (!user) {
      return;
    }

    const stillOnline = this.markUserOffline(user.id);
    if (!stillOnline) {
      await this.emitPresenceForUserConversations(user.id, user.role, false);
    }
  }

  @SubscribeMessage('chat:join')
  async onJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: WsJoinConversationDto,
  ) {
    const user = client.data.user as SocketUser | undefined;
    if (!user) {
      client.emit('chat:error', { message: 'No autorizado.' });
      client.disconnect();
      return;
    }

    try {
      await this.chatService.canAccessConversation(user.id, user.role, payload.conversationId);
      await client.join(payload.conversationId);
      client.emit('chat:joined', { conversationId: payload.conversationId });

      const counterpartOnline = await this.isCounterpartOnline(user.id, user.role, payload.conversationId);
      client.emit('chat:presence:result', {
        conversationId: payload.conversationId,
        counterpartOnline,
      });
    } catch {
      client.emit('chat:error', { message: 'No tiene permiso para esta conversación.' });
    }
  }

  @SubscribeMessage('chat:presence:check')
  async onPresenceCheck(@ConnectedSocket() client: Socket, @MessageBody() payload: { conversationId: string }) {
    const user = client.data.user as SocketUser | undefined;
    if (!user) {
      client.emit('chat:error', { message: 'No autorizado.' });
      client.disconnect();
      return;
    }

    try {
      await this.chatService.canAccessConversation(user.id, user.role, payload.conversationId);
      const counterpartOnline = await this.isCounterpartOnline(user.id, user.role, payload.conversationId);
      client.emit('chat:presence:result', {
        conversationId: payload.conversationId,
        counterpartOnline,
      });
    } catch {
      client.emit('chat:error', { message: 'No se pudo verificar la presencia.' });
    }
  }

  @SubscribeMessage('chat:message:send')
  async onSendMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: WsSendMessageDto) {
    const user = client.data.user as SocketUser | undefined;
    if (!user) {
      client.emit('chat:error', { message: 'No autorizado.' });
      client.disconnect();
      return;
    }

    try {
      const created = await this.chatService.sendMessage(user.id, user.role, payload.conversationId, payload.content);
      this.server.to(payload.conversationId).emit('chat:message:new', created);
      return created;
    } catch {
      client.emit('chat:error', { message: 'No se pudo enviar el mensaje.' });
      return null;
    }
  }

  private async resolveUserFromSocket(client: Socket): Promise<SocketUser | null> {
    const authToken = client.handshake.auth?.token;
    const authHeader = client.handshake.headers.authorization;

    const headerToken =
      typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')
        ? authHeader.slice(7).trim()
        : null;

    const token = typeof authToken === 'string' && authToken.trim() ? authToken.trim() : headerToken;
    if (!token) {
      return null;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string; role: string }>(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });

      if (!payload?.sub || !payload?.role) {
        return null;
      }

      return { id: payload.sub, role: payload.role };
    } catch {
      return null;
    }
  }

  private markUserOnline(userId: string) {
    const current = this.onlineUsers.get(userId) ?? 0;
    this.onlineUsers.set(userId, current + 1);
  }

  private markUserOffline(userId: string) {
    const current = this.onlineUsers.get(userId) ?? 0;
    if (current <= 1) {
      this.onlineUsers.delete(userId);
      return false;
    }

    this.onlineUsers.set(userId, current - 1);
    return true;
  }

  private isUserOnline(userId: string) {
    return (this.onlineUsers.get(userId) ?? 0) > 0;
  }

  private async isCounterpartOnline(requesterId: string, requesterRole: string, conversationId: string) {
    const conversation = await this.chatService.canAccessConversation(requesterId, requesterRole, conversationId);
    const normalizedRole = String(requesterRole || '').toUpperCase();
    const counterpartId = normalizedRole === 'ADVISOR' ? conversation.user.id : conversation.advisor.id;
    return this.isUserOnline(counterpartId);
  }

  private async emitPresenceForUserConversations(userId: string, role: string, online: boolean) {
    const conversationIds = await this.chatService.listConversationIdsForUser(userId);
    if (!conversationIds.length) {
      return;
    }

    for (const conversationId of conversationIds) {
      this.server.to(conversationId).emit('chat:presence:update', {
        conversationId,
        userId,
        role,
        online,
      });
    }
  }

  private isOriginAllowed(origin: string) {
    if (!origin) {
      return true;
    }

    if (this.allowAllOrigins || this.allowedOrigins.length === 0) {
      return true;
    }

    return this.allowedOrigins.includes(origin);
  }
}

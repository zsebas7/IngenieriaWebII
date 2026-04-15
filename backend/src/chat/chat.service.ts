import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatConversation } from '../entities/chat-conversation.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { User } from '../entities/user.entity';
import { Role } from '../common/enums/role.enum';
import { OpenConversationDto } from './dto/open-conversation.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatConversation)
    private readonly conversationsRepository: Repository<ChatConversation>,
    @InjectRepository(ChatMessage)
    private readonly messagesRepository: Repository<ChatMessage>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async listConversations(userId: string, role: string) {
    const normalizedRole = String(role || '').toUpperCase();

    const where =
      normalizedRole === Role.ADVISOR
        ? { advisor: { id: userId } }
        : normalizedRole === Role.USER
          ? { user: { id: userId } }
          : null;

    if (!where) {
      throw new ForbiddenException('Rol no autorizado para chat de asesor.');
    }

    const conversations = await this.conversationsRepository.find({
      where,
      relations: ['advisor', 'user'],
      order: { updatedAt: 'DESC' },
      take: 50,
    });

    return Promise.all(
      conversations.map(async (conversation) => {
        const lastMessage = await this.messagesRepository.findOne({
          where: { conversation: { id: conversation.id } },
          relations: ['sender'],
          order: { createdAt: 'DESC' },
        });

        const lastReadAt = this.getLastReadAtByRole(conversation, normalizedRole);
        const unreadCount = await this.countUnreadMessages(conversation.id, normalizedRole, lastReadAt);

        return {
          id: conversation.id,
          title: conversation.title,
          status: conversation.status,
          advisor: {
            id: conversation.advisor.id,
            fullName: conversation.advisor.fullName,
          },
          user: {
            id: conversation.user.id,
            fullName: conversation.user.fullName,
          },
          updatedAt: conversation.updatedAt,
          lastMessage: lastMessage?.content ?? null,
          lastMessageAt: lastMessage?.createdAt ?? null,
          unreadCount,
          hasUnread: unreadCount > 0,
        };
      }),
    );
  }

  async openConversation(advisorId: string, dto: OpenConversationDto) {
    const advisor = await this.usersRepository.findOneByOrFail({ id: advisorId });
    if (advisor.role !== Role.ADVISOR) {
      throw new ForbiddenException('Solo asesores pueden abrir conversaciones.');
    }

    const user = await this.usersRepository.findOneByOrFail({ id: dto.userId });
    if (user.role !== Role.USER) {
      throw new BadRequestException('La conversación solo se puede abrir para usuarios finales.');
    }

    const existingOpen = await this.conversationsRepository.findOne({
      where: {
        advisor: { id: advisor.id },
        user: { id: user.id },
        status: 'OPEN',
      },
      relations: ['advisor', 'user'],
    });

    if (existingOpen) {
      return existingOpen;
    }

    const conversation = this.conversationsRepository.create({
      advisor,
      user,
      title: dto.title?.trim() || `Chat con ${user.fullName}`,
      status: 'OPEN',
      advisorLastReadAt: new Date(),
      userLastReadAt: null,
    });

    return this.conversationsRepository.save(conversation);
  }

  async closeConversation(advisorId: string, conversationId: string) {
    const conversation = await this.findConversationOrFail(conversationId);
    if (conversation.advisor.id !== advisorId) {
      throw new ForbiddenException('Solo el asesor dueño puede cerrar la conversación.');
    }

    conversation.status = 'CLOSED';
    await this.conversationsRepository.save(conversation);
    return { success: true };
  }

  async listMessages(userId: string, role: string, conversationId: string) {
    const conversation = await this.findConversationOrFail(conversationId);
    const normalizedRole = String(role || '').toUpperCase();
    this.assertParticipantAccess(conversation, userId, normalizedRole);

    const messages = await this.messagesRepository.find({
      where: { conversation: { id: conversationId } },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
      take: 300,
    });

    await this.markConversationAsRead(conversation, normalizedRole);
    return messages;
  }

  async sendMessage(userId: string, role: string, conversationId: string, content: string) {
    const conversation = await this.findConversationOrFail(conversationId);
    this.assertParticipantAccess(conversation, userId, role);

    if (conversation.status !== 'OPEN') {
      throw new BadRequestException('La conversación está cerrada.');
    }

    const sender = await this.usersRepository.findOneByOrFail({ id: userId });
    const message = this.messagesRepository.create({
      conversation,
      sender,
      content: content.trim(),
    });
    const saved = await this.messagesRepository.save(message);

    const senderRole = String(sender.role || '').toUpperCase();
    if (senderRole === Role.ADVISOR) {
      conversation.advisorLastReadAt = saved.createdAt;
    } else if (senderRole === Role.USER) {
      conversation.userLastReadAt = saved.createdAt;
    }

    await this.conversationsRepository.save(conversation);

    return {
      id: saved.id,
      content: saved.content,
      createdAt: saved.createdAt,
      conversationId: conversation.id,
      sender: {
        id: sender.id,
        fullName: sender.fullName,
        role: sender.role,
      },
    };
  }

  async canAccessConversation(userId: string, role: string, conversationId: string) {
    const conversation = await this.findConversationOrFail(conversationId);
    this.assertParticipantAccess(conversation, userId, role);
    return conversation;
  }

  async listConversationIdsForUser(userId: string) {
    const conversations = await this.conversationsRepository.find({
      where: [{ advisor: { id: userId } }, { user: { id: userId } }],
      select: ['id'],
      take: 300,
    });

    return conversations.map((item) => item.id);
  }

  private async findConversationOrFail(conversationId: string) {
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId },
      relations: ['advisor', 'user'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversación no encontrada.');
    }

    return conversation;
  }

  private assertParticipantAccess(conversation: ChatConversation, userId: string, role: string) {
    const normalizedRole = String(role || '').toUpperCase();
    const isAdvisor = normalizedRole === Role.ADVISOR && conversation.advisor.id === userId;
    const isUser = normalizedRole === Role.USER && conversation.user.id === userId;

    if (!isAdvisor && !isUser) {
      throw new ForbiddenException('No tiene permiso para acceder a esta conversación.');
    }
  }

  private getLastReadAtByRole(conversation: ChatConversation, role: string) {
    return role === Role.ADVISOR ? conversation.advisorLastReadAt : conversation.userLastReadAt;
  }

  private async markConversationAsRead(conversation: ChatConversation, role: string) {
    if (role === Role.ADVISOR) {
      conversation.advisorLastReadAt = new Date();
      await this.conversationsRepository.save(conversation);
      return;
    }

    if (role === Role.USER) {
      conversation.userLastReadAt = new Date();
      await this.conversationsRepository.save(conversation);
    }
  }

  private async countUnreadMessages(conversationId: string, role: string, lastReadAt: Date | null) {
    const senderRole = role === Role.ADVISOR ? Role.USER : Role.ADVISOR;

    const query = this.messagesRepository
      .createQueryBuilder('message')
      .innerJoin('message.sender', 'sender')
      .where('message.conversationId = :conversationId', { conversationId })
      .andWhere('sender.role = :senderRole', { senderRole });

    if (lastReadAt) {
      query.andWhere('message.createdAt > :lastReadAt', { lastReadAt });
    }

    return query.getCount();
  }
}

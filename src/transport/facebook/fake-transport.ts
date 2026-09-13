import {
  MessagingTransport,
  OutgoingMessage,
  SendResult,
  ReactionEmoji,
  TransportEvent,
} from '../interfaces/transport.js';
import { NormalizedMessage } from '../interfaces/message.js';
import { Thread } from '../interfaces/thread.js';
import { TransportUser } from '../interfaces/user.js';

export class FakeFacebookTransport implements MessagingTransport {
  readonly name = 'fake-facebook';
  private connected = false;

  private messageHandler?: (msg: NormalizedMessage) => Promise<void>;
  private eventHandler?: (evt: TransportEvent) => Promise<void>;

  public sentMessages: Array<{ threadId: string; message: OutgoingMessage }> = [];
  public reactions: Array<{ messageId: string; reaction: ReactionEmoji }> = [];
  public readThreads: string[] = [];

  // Failure simulation hooks
  public shouldFailSend = false;
  public failureError = new Error('Simulated transport failure');
  public sendDelayMs = 0;

  get isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async sendMessage(threadId: string, message: OutgoingMessage): Promise<SendResult> {
    if (this.sendDelayMs > 0) {
      await new Promise((r) => setTimeout(r, this.sendDelayMs));
    }
    if (this.shouldFailSend) {
      throw this.failureError;
    }

    this.sentMessages.push({ threadId, message });
    return {
      messageId: `fake-msg-${Date.now()}-${this.sentMessages.length}`,
      threadId,
      timestamp: Date.now(),
    };
  }

  async react(messageId: string, reaction: ReactionEmoji): Promise<void> {
    this.reactions.push({ messageId, reaction });
  }

  async getThread(threadId: string): Promise<Thread> {
    return {
      id: threadId,
      type: threadId.startsWith('group_') ? 'GROUP' : 'USER',
      name: `Thread ${threadId}`,
      adminIds: ['admin123'],
      participants: [
        { id: 'user1', name: 'User One' },
        { id: 'user2', name: 'User Two' },
      ],
      metadata: {},
    };
  }

  async getUser(userId: string): Promise<TransportUser> {
    return {
      id: userId,
      name: `User ${userId}`,
    };
  }

  async markRead(threadId: string): Promise<void> {
    this.readThreads.push(threadId);
  }

  onMessage(handler: (msg: NormalizedMessage) => Promise<void>): void {
    this.messageHandler = handler;
  }

  onEvent(handler: (event: TransportEvent) => Promise<void>): void {
    this.eventHandler = handler;
  }

  // Testing helpers to simulate incoming events
  async simulateIncomingMessage(msg: Partial<NormalizedMessage>): Promise<void> {
    if (this.messageHandler) {
      const fullMsg: NormalizedMessage = {
        id: msg.id || `in-msg-${Date.now()}-${Math.random()}`,
        threadId: msg.threadId || 'thread1',
        senderId: msg.senderId || 'user1',
        text: msg.text || '',
        attachments: msg.attachments || [],
        mentions: msg.mentions || [],
        createdAt: msg.createdAt || new Date(),
        source: 'realtime',
        metadata: msg.metadata || {},
      };
      await this.messageHandler(fullMsg);
    }
  }

  async simulateIncomingEvent(event: TransportEvent): Promise<void> {
    if (this.eventHandler) {
      await this.eventHandler(event);
    }
  }

  reset(): void {
    this.sentMessages = [];
    this.reactions = [];
    this.readThreads = [];
    this.shouldFailSend = false;
  }
}

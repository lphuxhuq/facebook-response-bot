import { NormalizedMessage, Attachment } from './message.js';
import { Thread } from './thread.js';
import { TransportUser } from './user.js';

export interface OutgoingMessage {
  text?: string;
  attachments?: Attachment[];
  replyToMessageId?: string;
  mentions?: Array<{ tag: string; id: string }>;
}

export interface SendResult {
  messageId: string;
  threadId: string;
  timestamp: number;
}

export type ReactionEmoji = '👍' | '❤️' | '😆' | '😮' | '😢' | '😡';

export interface TransportEvent {
  type: 'reaction' | 'participant_join' | 'participant_leave' | 'thread_update';
  threadId: string;
  actorId: string;
  timestamp: number;
  data: Record<string, unknown>;
}

export interface MessagingTransport {
  readonly name: string;
  readonly isConnected: boolean;

  connect(): Promise<void>;
  disconnect(): Promise<void>;

  sendMessage(threadId: string, message: OutgoingMessage): Promise<SendResult>;
  react(messageId: string, reaction: ReactionEmoji): Promise<void>;
  getThread(threadId: string): Promise<Thread>;
  getUser(userId: string): Promise<TransportUser>;
  markRead(threadId: string): Promise<void>;

  onMessage(handler: (msg: NormalizedMessage) => Promise<void>): void;
  onEvent(handler: (event: TransportEvent) => Promise<void>): void;
}

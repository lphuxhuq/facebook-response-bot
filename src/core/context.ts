export enum Role {
  BANNED = -1,
  USER = 0,
  MODERATOR = 1,
  ADMIN = 2,
  OWNER = 3,
}

export interface Attachment {
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
}

export interface OutgoingMessage {
  text?: string;
  attachments?: Attachment[];
  replyToMessageId?: string;
  quickReplies?: Array<{ title: string; payload: string }>;
}

export interface SendResult {
  messageId: string;
  recipientId: string;
  timestamp: number;
}

export interface User {
  id: string;
  platform: string;
  name?: string;
  role: Role;
  balance?: number;
  exp?: number;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  platform: string;
  isGroup: boolean;
  name?: string;
  createdAt: Date;
}

export interface MessageContext {
  readonly platform: 'facebook' | 'test';
  readonly userId: string;
  readonly conversationId: string;
  readonly messageId: string;
  readonly text: string;
  readonly attachments: Attachment[];
  readonly isGroup: boolean;
  readonly timestamp: number;

  reply(message: OutgoingMessage | string): Promise<SendResult>;
  send(message: OutgoingMessage | string): Promise<SendResult>;
  react(emoji: string): Promise<void>;

  getUser?(): Promise<User>;
  getConversation?(): Promise<Conversation>;
}

export interface CommandContext extends MessageContext {
  readonly commandName: string;
  readonly args: string[];
  readonly rawArgs: string;
  readonly userRole: Role;
  readonly sessionManager: any;
  readonly services: any;
  readonly repositories: any;
}

export interface Command {
  readonly name: string;
  readonly aliases?: string[];
  readonly description: string;
  readonly usage?: string;
  readonly category: string;
  readonly requiredRole?: Role;
  readonly cooldown?: number; // In seconds
  execute(ctx: CommandContext): Promise<void>;
}

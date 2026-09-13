export interface Attachment {
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
}

export interface Mention {
  tag: string;
  id: string;
}

export interface NormalizedMessage {
  id: string;
  threadId: string;
  senderId: string;
  recipientId?: string;
  text: string;
  attachments: Attachment[];
  mentions: Mention[];
  replyToMessageId?: string;
  createdAt: Date;
  source: 'realtime' | 'sync';
  metadata: Record<string, unknown>;
}

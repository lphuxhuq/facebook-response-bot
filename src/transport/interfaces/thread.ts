export type ThreadType = 'GROUP' | 'USER' | 'UNKNOWN';

export interface ThreadParticipant {
  id: string;
  name?: string;
  nickname?: string;
  isBot?: boolean;
}

export interface Thread {
  id: string;
  type: ThreadType;
  name?: string;
  adminIds: string[];
  participants: ThreadParticipant[];
  metadata: Record<string, unknown>;
}

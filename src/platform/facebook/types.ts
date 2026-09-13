export interface WebhookEntry {
  id: string;
  time: number;
  messaging?: WebhookMessagingEvent[];
}

export interface WebhookMessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    quick_reply?: { payload: string };
    attachments?: Array<{
      type: string;
      payload: { url: string };
    }>;
    reply_to?: {
      mid: string;
    };
  };
  postback?: {
    mid?: string;
    title: string;
    payload: string;
  };
  reaction?: {
    mid: string;
    action: 'react' | 'unreact';
    reaction: string;
    emoji: string;
  };
  delivery?: {
    mids: string[];
    watermark: number;
  };
  read?: {
    watermark: number;
  };
}

export interface WebhookPayload {
  object: 'page' | string;
  entry: WebhookEntry[];
}

export interface GraphApiSendMessagePayload {
  recipient: { id: string };
  message: {
    text?: string;
    attachment?: {
      type: 'image' | 'video' | 'audio' | 'file';
      payload: { url: string; is_reusable?: boolean };
    };
    quick_replies?: Array<{
      content_type: 'text';
      title: string;
      payload: string;
    }>;
  };
  messaging_type?: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG';
  tag?: string;
}

export interface GraphApiSendResponse {
  recipient_id: string;
  message_id: string;
}

export interface GraphApiErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}

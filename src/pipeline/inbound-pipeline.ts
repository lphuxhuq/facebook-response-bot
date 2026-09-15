import { MessageContext } from '../core/context.js';
import { BotCore } from '../core/bot.js';
import { ProcessedEventRepository } from '../repositories/processed-event.repository.js';
import { MessageHistoryRepository } from '../repositories/message-history.repository.js';
import { TokenBucketRateLimiter } from '../core/cooldown-manager.js';
import { logger } from '../utils/logger.js';

export interface InboundPipelineDeps {
  botCore: BotCore;
  processedEvents: ProcessedEventRepository;
  messageHistory: MessageHistoryRepository;
  rateLimiter?: TokenBucketRateLimiter;
}

/**
 * Phase 9+10 inbound pipeline (transport-agnostic):
 *
 *   NormalizedMessage(ctx)
 *     -> Inbound Rate Limiter (Token bucket per sender)
 *     -> DB deduplication (processed_events, survives restarts)
 *     -> message persistence (messages table)
 *     -> BotCore (CommandRouter / EventRouter)
 *
 * Raw transport events must already be converted to MessageContext by the
 * transport layer before entering this pipeline.
 */
export class InboundPipeline {
  private readonly botCore: BotCore;
  private readonly processedEvents: ProcessedEventRepository;
  private readonly messageHistory: MessageHistoryRepository;
  private readonly rateLimiter?: TokenBucketRateLimiter;

  constructor(deps: InboundPipelineDeps) {
    this.botCore = deps.botCore;
    this.processedEvents = deps.processedEvents;
    this.messageHistory = deps.messageHistory;
    this.rateLimiter = deps.rateLimiter;
  }

  /**
   * @returns true when the message was newly accepted for processing.
   * Duplicate deliveries (At-least-once webhooks, restart replays) return false
   * and are NOT executed a second time.
   */
  async accept(ctx: MessageContext): Promise<boolean> {
    // 0. Rate limiting (protection against flood/spam)
    if (this.rateLimiter) {
      const allowed = this.rateLimiter.consume(`${ctx.platform}:${ctx.userId}`);
      if (!allowed) {
        logger.warn({ userId: ctx.userId, platform: ctx.platform }, 'Inbound message dropped: sender rate limit exceeded');
        return false;
      }
    }

    // 1. DB-backed deduplication (platform + message_id unique)
    let isNew: boolean;
    try {
      isNew = this.processedEvents.markIfNew(ctx.platform, ctx.messageId);
    } catch (err) {
      // Dedup store failure must not block message processing (availability first)
      logger.error({ err, messageId: ctx.messageId }, 'Deduplication check failed, processing anyway');
      isNew = true;
    }

    if (!isNew) {
      logger.info({ messageId: ctx.messageId, platform: ctx.platform }, 'Duplicate message ignored (DB dedup)');
      return false;
    }

    // 2. Persist message history (best-effort, never blocks the pipeline)
    try {
      this.messageHistory.saveMessage({
        id: ctx.messageId,
        threadId: ctx.conversationId,
        senderId: ctx.userId,
        text: ctx.text,
        attachments: ctx.attachments.map((a) => ({
          type: a.type,
          url: 'url' in a ? a.url : '',
        })),
        mentions: [],
        createdAt: new Date(ctx.timestamp),
        source: 'realtime',
        metadata: { isGroup: ctx.isGroup },
      });
    } catch (err) {
      logger.error({ err, messageId: ctx.messageId }, 'Failed to persist message history');
    }

    // 3. Hand off to BotCore
    await this.botCore.processMessage(ctx);
    return true;
  }
}

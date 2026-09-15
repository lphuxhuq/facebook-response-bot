import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { getDatabase, closeDatabase } from '../../src/database/index.js';
import { ProcessedEventRepository } from '../../src/repositories/processed-event.repository.js';
import { MessageHistoryRepository } from '../../src/repositories/message-history.repository.js';
import { InboundPipeline } from '../../src/pipeline/inbound-pipeline.js';
import { BotCore } from '../../src/core/bot.js';
import { Command, MessageContext } from '../../src/core/context.js';
import { TokenBucketRateLimiter } from '../../src/core/cooldown-manager.js';

function makeCtx(messageId: string, text = '!dedup-test'): MessageContext {
  return {
    platform: 'facebook',
    userId: 'user_1',
    conversationId: 'thread_1',
    messageId,
    text,
    attachments: [],
    isGroup: false,
    timestamp: Date.now(),
    reply: vi.fn().mockResolvedValue({ messageId: 'r1', recipientId: 'user_1', timestamp: Date.now() }),
    send: vi.fn(),
    react: vi.fn(),
  };
}

describe('Inbound Pipeline — DB-backed Deduplication', () => {
  let db: ReturnType<typeof getDatabase>;
  let pipeline: InboundPipeline;
  let executeSpy: ReturnType<typeof vi.fn>;
  let historyRepo: MessageHistoryRepository;

  beforeAll(() => {
    db = getDatabase(':memory:');
    historyRepo = new MessageHistoryRepository(db);
    const processed = new ProcessedEventRepository(db);

    executeSpy = vi.fn().mockResolvedValue(undefined);
    const testCommand: Command = {
      name: 'dedup-test',
      description: 'test',
      category: 'test',
      cooldown: 0,
      execute: executeSpy,
    };

    const botCore = new BotCore({ prefix: '!', ownerId: 'owner1', repositories: {} });
    botCore.commandRouter.register(testCommand);

    pipeline = new InboundPipeline({
      botCore,
      processedEvents: processed,
      messageHistory: historyRepo,
    });
  });

  afterAll(() => {
    closeDatabase();
  });

  it('executes the command exactly once for the same messageId delivered twice', async () => {
    const ctx1 = makeCtx('mid_same_123');
    const ctx2 = makeCtx('mid_same_123');

    const firstAccepted = await pipeline.accept(ctx1);
    const secondAccepted = await pipeline.accept(ctx2);

    expect(firstAccepted).toBe(true);
    expect(secondAccepted).toBe(false);

    // Flush async command execution
    await new Promise((r) => setImmediate(r));
    expect(executeSpy).toHaveBeenCalledTimes(1);

    // ctx2 must never have been replied to
    expect(ctx2.reply).not.toHaveBeenCalled();
  });

  it('processes distinct messageIds independently', async () => {
    const before = executeSpy.mock.calls.length;
    await pipeline.accept(makeCtx('mid_other_1'));
    await pipeline.accept(makeCtx('mid_other_2'));
    await new Promise((r) => setImmediate(r));
    expect(executeSpy.mock.calls.length).toBe(before + 2);
  });

  it('persists every accepted message into messages table', async () => {
    const recent = historyRepo.getRecentMessages('thread_1', 50);
    const ids = recent.map((m: any) => m.id);
    expect(ids).toContain('mid_same_123');
    expect(ids).toContain('mid_other_1');
    expect(ids).toContain('mid_other_2');
    // Duplicate delivery must not create a second row (INSERT OR IGNORE)
    expect(ids.filter((id: string) => id === 'mid_same_123').length).toBe(1);
  });

  it('dedup survives simulated restart (new repos, same DB)', async () => {
    // Simulate process restart: rebuild repos over the SAME database instance
    const processed2 = new ProcessedEventRepository(db);
    const executeSpy2 = vi.fn().mockResolvedValue(undefined);
    const cmd2: Command = {
      name: 'dedup-test',
      description: 'test',
      category: 'test',
      cooldown: 0,
      execute: executeSpy2,
    };
    const botCore2 = new BotCore({ prefix: '!', ownerId: 'owner1', repositories: {} });
    botCore2.commandRouter.register(cmd2);
    const pipeline2 = new InboundPipeline({
      botCore: botCore2,
      processedEvents: processed2,
      messageHistory: new MessageHistoryRepository(db),
    });

    // Same mid that was already processed BEFORE the "restart"
    const acceptedAfterRestart = await pipeline2.accept(makeCtx('mid_same_123'));
    expect(acceptedAfterRestart).toBe(false);

    // A fresh mid after restart still gets processed
    const fresh = await pipeline2.accept(makeCtx('mid_fresh_after_restart'));
    expect(fresh).toBe(true);
    await new Promise((r) => setImmediate(r));
    expect(executeSpy2).toHaveBeenCalledTimes(1);

    botCore2.shutdown();
  });

  it('drops messages when rate limiter threshold is exceeded', async () => {
    const rateLimiter = new TokenBucketRateLimiter({ capacity: 1, refillRate: 0.1 });
    const botCore = new BotCore({ prefix: '!', ownerId: 'owner1', repositories: {} });
    const pipelineWithRl = new InboundPipeline({
      botCore,
      processedEvents: new ProcessedEventRepository(db),
      messageHistory: historyRepo,
      rateLimiter,
    });

    const first = await pipelineWithRl.accept(makeCtx('mid_rl_1'));
    const second = await pipelineWithRl.accept(makeCtx('mid_rl_2'));

    expect(first).toBe(true);
    expect(second).toBe(false); // throttled
    botCore.shutdown();
  });
});

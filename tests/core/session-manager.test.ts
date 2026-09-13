import { describe, it, expect, afterEach } from 'vitest';
import { SessionManager, InMemorySessionStore } from '../../src/core/session-manager.js';

describe('SessionManager', () => {
  let sm: SessionManager;

  afterEach(() => {
    sm?.destroy();
  });

  it('should create and retrieve an active conversation session', async () => {
    sm = new SessionManager(new InMemorySessionStore(), 10);
    const session = await sm.create('thread1', 'user1', 'quiz', { questionIndex: 0 });

    expect(session.command).toBe('quiz');
    expect(session.state).toEqual({ questionIndex: 0 });

    const retrieved = await sm.get('thread1', 'user1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.command).toBe('quiz');
  });

  it('should update session state and step', async () => {
    sm = new SessionManager(new InMemorySessionStore(), 10);
    await sm.create('thread1', 'user1', 'quiz', { score: 0 }, 'step1');

    const updated = await sm.update('thread1', 'user1', { score: 10 }, 'step2');
    expect(updated?.step).toBe('step2');
    expect(updated?.state).toEqual({ score: 10 });
  });

  it('should return null for expired sessions', async () => {
    sm = new SessionManager(new InMemorySessionStore(), -1); // already expired
    await sm.create('thread1', 'user1', 'quiz', {});

    const retrieved = await sm.get('thread1', 'user1');
    expect(retrieved).toBeNull();
  });

  it('should delete sessions upon completion', async () => {
    sm = new SessionManager(new InMemorySessionStore(), 10);
    await sm.create('thread1', 'user1', 'quiz', {});
    await sm.delete('thread1', 'user1');

    expect(await sm.get('thread1', 'user1')).toBeNull();
  });
});

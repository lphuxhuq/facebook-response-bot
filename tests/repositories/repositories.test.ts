import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { initializeSchema } from '../../src/database/index.js';
import { UserRepository } from '../../src/repositories/user.repository.js';
import { SQLiteSessionStore } from '../../src/repositories/session.repository.js';
import { ConversationRepository } from '../../src/repositories/conversation.repository.js';
import { AuditLogRepository } from '../../src/repositories/audit-log.repository.js';
import { Role } from '../../src/core/context.js';

describe('Database Repositories', () => {
  let db: DatabaseSync;
  let userRepo: UserRepository;
  let sessionStore: SQLiteSessionStore;
  let convRepo: ConversationRepository;
  let auditRepo: AuditLogRepository;

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    initializeSchema(db);
    userRepo = new UserRepository(db);
    sessionStore = new SQLiteSessionStore(db);
    convRepo = new ConversationRepository(db);
    auditRepo = new AuditLogRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('UserRepository', () => {
    it('should create new user with default balance and USER role', async () => {
      const user = await userRepo.getOrCreate('user123', 'John Doe');
      expect(user.id).toBe('user123');
      expect(user.name).toBe('John Doe');
      expect(user.role).toBe(Role.USER);
      expect(user.balance).toBe(0);
    });

    it('should update and query user role correctly', async () => {
      await userRepo.getOrCreate('admin99', 'Admin');
      await userRepo.setUserRole('admin99', Role.ADMIN);

      expect(await userRepo.getUserRole('admin99')).toBe(Role.ADMIN);
    });

    it('should safely update balance without allowing negative numbers', async () => {
      await userRepo.getOrCreate('player1');
      const b1 = await userRepo.updateBalance('player1', 500);
      expect(b1).toBe(500);

      const b2 = await userRepo.updateBalance('player1', -200);
      expect(b2).toBe(300);

      // Attempting to deduct more than balance should cap at 0
      const b3 = await userRepo.updateBalance('player1', -1000);
      expect(b3).toBe(0);
    });
  });

  describe('SQLiteSessionStore', () => {
    it('should persist sessions across store lookups', async () => {
      const session = {
        id: 'sess1',
        userId: 'u1',
        conversationId: 'c1',
        command: 'quiz',
        state: { q: 1 },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
      };

      await sessionStore.set(session);
      const retrieved = await sessionStore.get('c1', 'u1');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.command).toBe('quiz');
      expect(retrieved?.state).toEqual({ q: 1 });
    });

    it('should delete session on demand', async () => {
      const session = {
        id: 'sess2',
        userId: 'u2',
        conversationId: 'c2',
        command: 'quiz',
        state: {},
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
      };

      await sessionStore.set(session);
      await sessionStore.delete('c2', 'u2');

      const retrieved = await sessionStore.get('c2', 'u2');
      expect(retrieved).toBeNull();
    });

    it('should clean up expired sessions', async () => {
      const expiredSession = {
        id: 'sess3',
        userId: 'u3',
        conversationId: 'c3',
        command: 'quiz',
        state: {},
        createdAt: new Date(Date.now() - 120000),
        expiresAt: new Date(Date.now() - 60000),
      };

      await sessionStore.set(expiredSession);
      const cleaned = await sessionStore.cleanupExpired();
      expect(cleaned).toBe(1);
    });
  });

  describe('AuditLogRepository', () => {
    it('should insert and retrieve audit logs', () => {
      auditRepo.log({
        userId: 'admin1',
        action: 'BAN_USER',
        details: { target: 'spammer' },
      });

      const recent = auditRepo.getRecent(10);
      expect(recent.length).toBe(1);
      expect(recent[0].action).toBe('BAN_USER');
      expect(JSON.parse(recent[0].details)).toEqual({ target: 'spammer' });
    });
  });
});

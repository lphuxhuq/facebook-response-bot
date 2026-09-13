import { DatabaseSync } from 'node:sqlite';
import { Role, User } from '../core/context.js';
import { PermissionProvider } from '../core/permission-manager.js';

export interface CreateUserData {
  id: string;
  platform?: string;
  name?: string;
  role?: Role;
  balance?: number;
  exp?: number;
}

export class UserRepository implements PermissionProvider {
  constructor(private db: DatabaseSync) {}

  async findById(id: string): Promise<User | null> {
    const query = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const row = query.get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      platform: row.platform,
      name: row.name,
      role: row.role,
      balance: row.balance,
      exp: row.exp,
      createdAt: new Date(row.created_at),
    };
  }

  async getOrCreate(id: string, defaultName?: string): Promise<User> {
    const existing = await this.findById(id);
    if (existing) {
      if (defaultName && existing.name !== defaultName) {
        this.updateName(id, defaultName);
        existing.name = defaultName;
      }
      return existing;
    }

    const now = Date.now();
    const insert = this.db.prepare(`
      INSERT INTO users (id, platform, name, role, balance, exp, created_at, updated_at)
      VALUES (?, 'facebook', ?, 0, 0, 0, ?, ?)
    `);
    insert.run(id, defaultName || null, now, now);

    return {
      id,
      platform: 'facebook',
      name: defaultName,
      role: Role.USER,
      balance: 0,
      exp: 0,
      createdAt: new Date(now),
    };
  }

  async getUserRole(userId: string): Promise<Role> {
    const user = await this.findById(userId);
    return user ? user.role : Role.USER;
  }

  async setUserRole(userId: string, role: Role): Promise<void> {
    await this.getOrCreate(userId);
    const update = this.db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?');
    update.run(role, Date.now(), userId);
  }

  updateName(id: string, name: string): void {
    const update = this.db.prepare('UPDATE users SET name = ?, updated_at = ? WHERE id = ?');
    update.run(name, Date.now(), id);
  }

  async updateBalance(id: string, delta: number): Promise<number> {
    await this.getOrCreate(id);
    const update = this.db.prepare(`
      UPDATE users 
      SET balance = MAX(0, balance + ?), updated_at = ? 
      WHERE id = ?
      RETURNING balance
    `);
    const result = update.get(delta, Date.now(), id) as any;
    return result.balance;
  }

  async getBalance(id: string): Promise<number> {
    const user = await this.findById(id);
    return user?.balance ?? 0;
  }
}

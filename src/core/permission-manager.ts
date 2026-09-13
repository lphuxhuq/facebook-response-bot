import { Role } from './context.js';
import { PermissionDeniedError } from '../utils/errors.js';

export interface PermissionProvider {
  getUserRole(userId: string): Promise<Role>;
  setUserRole(userId: string, role: Role): Promise<void>;
}

export class InMemoryPermissionProvider implements PermissionProvider {
  private roles = new Map<string, Role>();

  constructor(ownerId?: string) {
    if (ownerId) {
      this.roles.set(ownerId, Role.OWNER);
    }
  }

  async getUserRole(userId: string): Promise<Role> {
    return this.roles.get(userId) ?? Role.USER;
  }

  async setUserRole(userId: string, role: Role): Promise<void> {
    this.roles.set(userId, role);
  }
}

export class PermissionManager {
  constructor(private provider: PermissionProvider) {}

  async getRole(userId: string): Promise<Role> {
    return this.provider.getUserRole(userId);
  }

  async setRole(userId: string, role: Role): Promise<void> {
    return this.provider.setUserRole(userId, role);
  }

  async isAuthorized(userId: string, requiredRole: Role = Role.USER): Promise<boolean> {
    const userRole = await this.getRole(userId);
    if (userRole === Role.BANNED) {
      return false;
    }
    return userRole >= requiredRole;
  }

  async assertAuthorized(userId: string, requiredRole: Role = Role.USER): Promise<void> {
    const authorized = await this.isAuthorized(userId, requiredRole);
    if (!authorized) {
      const userRole = await this.getRole(userId);
      if (userRole === Role.BANNED) {
        throw new PermissionDeniedError('User is banned from using the bot');
      }
      throw new PermissionDeniedError(`Insufficient permission: required ${Role[requiredRole]}, has ${Role[userRole]}`);
    }
  }
}

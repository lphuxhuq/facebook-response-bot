import { Command, CommandContext, MessageContext, Role } from './context.js';
import { PermissionManager } from './permission-manager.js';
import { CooldownManager } from './cooldown-manager.js';
import { SessionManager } from './session-manager.js';
import { logger } from '../utils/logger.js';
import { BotError } from '../utils/errors.js';

/** Minimal execution gate (implemented by reliability/HealthMonitor). */
export interface ExecutionGate {
  isExecutionAllowed(): boolean;
}

export interface CommandRouterOptions {
  prefix: string;
  permissionManager: PermissionManager;
  cooldownManager: CooldownManager;
  sessionManager: SessionManager;
  services?: any;
  repositories?: any;
  healthMonitor?: ExecutionGate;
}

export class CommandRouter {
  private commands = new Map<string, Command>();
  private aliases = new Map<string, string>();
  private prefix: string;
  private permissionManager: PermissionManager;
  private cooldownManager: CooldownManager;
  private sessionManager: SessionManager;
  private services: any;
  private repositories: any;
  private healthMonitor?: ExecutionGate;

  constructor(options: CommandRouterOptions) {
    this.prefix = options.prefix;
    this.permissionManager = options.permissionManager;
    this.cooldownManager = options.cooldownManager;
    this.sessionManager = options.sessionManager;
    this.services = options.services || {};
    this.repositories = options.repositories || {};
    this.healthMonitor = options.healthMonitor;
  }

  register(command: Command): void {
    const name = command.name.toLowerCase();
    if (this.commands.has(name)) {
      logger.warn({ command: name }, 'Command already registered, overwriting');
    }
    this.commands.set(name, command);

    if (command.aliases) {
      for (const alias of command.aliases) {
        this.aliases.set(alias.toLowerCase(), name);
      }
    }
  }

  unregister(commandName: string): void {
    const name = commandName.toLowerCase();
    const command = this.commands.get(name);
    if (!command) return;

    if (command.aliases) {
      for (const alias of command.aliases) {
        this.aliases.delete(alias.toLowerCase());
      }
    }
    this.commands.delete(name);
  }

  getCommand(nameOrAlias: string): Command | undefined {
    const lower = nameOrAlias.toLowerCase();
    const primaryName = this.aliases.get(lower) || lower;
    return this.commands.get(primaryName);
  }

  getAllCommands(): Command[] {
    return Array.from(this.commands.values());
  }

  async handleMessage(ctx: MessageContext): Promise<boolean> {
    const trimmed = (ctx.text || '').trim();
    if (!trimmed) return false;

    // 1. Check if user is in an active session (interactive reply flow)
    const session = await this.sessionManager.get(ctx.conversationId, ctx.userId);
    if (session) {
      const activeCommand = this.getCommand(session.command);
      if (activeCommand) {
        const userRole = await this.permissionManager.getRole(ctx.userId);

        // Kill switch applies to dialog replies too (except ADMIN+)
        if (this.healthMonitor && !this.healthMonitor.isExecutionAllowed() && userRole < Role.ADMIN) {
          logger.warn({ userId: ctx.userId, session: session.command }, 'Session reply blocked: bot is paused');
          return true;
        }

        const cmdCtx: CommandContext = {
          ...ctx,
          commandName: session.command,
          args: trimmed.split(/\s+/),
          rawArgs: trimmed,
          userRole,
          sessionManager: this.sessionManager,
          services: this.services,
          repositories: this.repositories,
        };

        try {
          await activeCommand.execute(cmdCtx);
          return true;
        } catch (err: any) {
          logger.error({ err, session }, 'Error executing session reply handler');
          await ctx.reply(`⚠️ Session error: ${err.message || 'Unknown error'}`);
          return true;
        }
      }
    }

    // 2. Check for prefix (support group-specific override if present)
    let effectivePrefix = this.prefix;
    if (ctx.isGroup && this.repositories?.threadSettings) {
      const settings = this.repositories.threadSettings.getSettings(ctx.conversationId);
      if (settings?.prefix) {
        effectivePrefix = settings.prefix;
      }
    }

    if (!trimmed.startsWith(effectivePrefix)) {
      return false;
    }

    const withoutPrefix = trimmed.slice(effectivePrefix.length).trim();
    const parts = withoutPrefix.split(/\s+/);
    const trigger = parts[0]?.toLowerCase();
    if (!trigger) return false;

    const command = this.getCommand(trigger);
    if (!command) {
      return false; // Unknown command - ignore or let event router handle
    }

    // Check scope: DM vs GROUP
    if (command.scope === 'GROUP' && !ctx.isGroup) {
      await ctx.reply(`⛔ Lệnh '${command.name}' chỉ có thể sử dụng trong Nhóm Chat (Group).`);
      return true;
    }
    if (command.scope === 'DM' && ctx.isGroup) {
      await ctx.reply(`⛔ Lệnh '${command.name}' chỉ có thể sử dụng trong Tin Nhắn Riêng (DM).`);
      return true;
    }

    const args = parts.slice(1);
    const rawArgs = withoutPrefix.slice(trigger.length).trim();

    // 3. Permission verification
    const userRole = await this.permissionManager.getRole(ctx.userId);
    const requiredRole = command.requiredRole ?? Role.USER;

    if (userRole === Role.BANNED) {
      logger.info({ userId: ctx.userId }, 'Banned user attempted command execution');
      return true;
    }

    // 3b. Kill switch / auth-error gate: while paused, only ADMIN+ commands may run
    if (this.healthMonitor && !this.healthMonitor.isExecutionAllowed() && userRole < Role.ADMIN) {
      logger.warn({ userId: ctx.userId, command: command.name }, 'Command blocked: bot is paused');
      await ctx.reply('⏸️ Bot đang tạm dừng. Vui lòng thử lại sau.');
      return true;
    }

    if (userRole < requiredRole) {
      await ctx.reply(`⛔ Bạn không có quyền dùng lệnh '${command.name}'. Yêu cầu cấp bậc: ${Role[requiredRole]}`);
      return true;
    }

    // 4. Cooldown verification
    if (command.cooldown && command.cooldown > 0 && userRole < Role.ADMIN) {
      const check = this.cooldownManager.check(ctx.userId, command.name, command.cooldown);
      if (!check.allowed) {
        const waitSec = Math.ceil(check.remainingMs / 1000);
        await ctx.reply(`⏳ Vui lòng chờ ${waitSec} giây để tiếp tục dùng lệnh '${command.name}'.`);
        return true;
      }
      this.cooldownManager.set(ctx.userId, command.name, command.cooldown);
    }

    // 5. Execute Command with sandbox try/catch
    const cmdCtx: CommandContext = {
      ...ctx,
      commandName: command.name,
      args,
      rawArgs,
      userRole,
      sessionManager: this.sessionManager,
      services: this.services,
      repositories: this.repositories,
    };

    const startTime = Date.now();
    try {
      await command.execute(cmdCtx);
      logger.info(
        {
          command: command.name,
          userId: ctx.userId,
          conversationId: ctx.conversationId,
          durationMs: Date.now() - startTime,
        },
        'Command executed successfully'
      );
      return true;
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      logger.error(
        {
          command: command.name,
          userId: ctx.userId,
          durationMs,
          err,
        },
        'Command execution failed'
      );

      if (err instanceof BotError) {
        await ctx.reply(`⚠️ Lỗi: ${err.message}`);
      } else {
        await ctx.reply('⚠️ Đã xảy ra lỗi nội bộ khi thực thi lệnh. Vui lòng thử lại sau.');
      }
      return true;
    }
  }
}

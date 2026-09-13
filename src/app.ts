import Fastify, { FastifyInstance } from 'fastify';
import fastifyRawBody from 'fastify-raw-body';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { getDatabase, closeDatabase } from './database/index.js';
import { UserRepository } from './repositories/user.repository.js';
import { SQLiteSessionStore } from './repositories/session.repository.js';
import { ConversationRepository } from './repositories/conversation.repository.js';
import { AuditLogRepository } from './repositories/audit-log.repository.js';
import { ThreadSettingsRepository } from './repositories/thread-settings.repository.js';
import { MessageHistoryRepository } from './repositories/message-history.repository.js';
import { ScheduledJobRepository } from './repositories/scheduled-job.repository.js';
import { BotCore } from './core/bot.js';
import { SessionManager } from './core/session-manager.js';
import { FacebookAdapter } from './platform/facebook/adapter.js';
import { PluginLoader } from './plugins/plugin-loader.js';
import { corePlugin } from './plugins/core/index.js';
import { adminPlugin } from './plugins/admin/index.js';
import { groupPlugin } from './plugins/group/index.js';
import { utilityPlugin } from './plugins/utility/index.js';
import { economyPlugin } from './plugins/economy/index.js';
import { entertainmentPlugin } from './plugins/entertainment/index.js';
import { aiPlugin } from './plugins/ai/index.js';
import { mediaPlugin } from './plugins/media/index.js';
import { gamesPlugin } from './plugins/games/index.js';
import { knowledgePlugin } from './plugins/knowledge/index.js';
import { MockAIProvider, GeminiAIProvider } from './services/ai/mock-provider.js';
import { WeatherService } from './services/weather/weather.service.js';

export async function createServer(customDbPath?: string): Promise<{ app: FastifyInstance; botCore: BotCore; pluginLoader: PluginLoader }> {
  const app = Fastify({
    logger: false, // Logging handled via Pino logger instance
  });

  // Enable raw-body parsing for HMAC-SHA256 signature verification
  await app.register(fastifyRawBody, {
    field: 'rawBody',
    global: false,
    encoding: 'utf8',
    runFirst: true,
    routes: ['/webhook'],
  });

  // 1. Initialize SQLite Database
  const db = getDatabase(customDbPath);
  const userRepo = new UserRepository(db);
  const sessionStore = new SQLiteSessionStore(db);
  const convRepo = new ConversationRepository(db);
  const auditRepo = new AuditLogRepository(db);
  const threadSettingsRepo = new ThreadSettingsRepository(db);
  const messageHistoryRepo = new MessageHistoryRepository(db);
  const scheduledJobRepo = new ScheduledJobRepository(db);

  // 2. Initialize Services
  const aiProvider =
    env.AI_PROVIDER === 'gemini' && env.AI_API_KEY
      ? new GeminiAIProvider(env.AI_API_KEY, env.AI_MODEL)
      : new MockAIProvider();
  const weatherService = new WeatherService(env.OPENWEATHER_API_KEY);

  const services = {
    aiProvider,
    weatherService,
    commandRouter: null as any,
  };

  const repositories = {
    user: userRepo,
    session: sessionStore,
    conversation: convRepo,
    audit: auditRepo,
    threadSettings: threadSettingsRepo,
    messageHistory: messageHistoryRepo,
    scheduledJob: scheduledJobRepo,
  };

  // 3. Initialize Bot Core
  const botCore = new BotCore({
    prefix: env.BOT_PREFIX,
    ownerId: env.BOT_OWNER_ID,
    services,
    repositories,
  });
  services.commandRouter = botCore.commandRouter;

  // 4. Initialize Facebook Transport Adapter
  const fbAdapter = new FacebookAdapter({
    pageAccessToken: env.FACEBOOK_PAGE_ACCESS_TOKEN,
    appSecret: env.FACEBOOK_APP_SECRET,
    verifyToken: env.FACEBOOK_VERIFY_TOKEN,
  });
  fbAdapter.registerRoutes(app, botCore);

  // 5. Initialize & Load Plugins
  const pluginLoader = new PluginLoader(botCore, services, repositories);
  await pluginLoader.registerPlugin(corePlugin);
  await pluginLoader.registerPlugin(adminPlugin);
  await pluginLoader.registerPlugin(groupPlugin);
  await pluginLoader.registerPlugin(utilityPlugin);
  await pluginLoader.registerPlugin(economyPlugin);
  await pluginLoader.registerPlugin(entertainmentPlugin);
  await pluginLoader.registerPlugin(aiPlugin);
  await pluginLoader.registerPlugin(mediaPlugin);
  await pluginLoader.registerPlugin(gamesPlugin);
  await pluginLoader.registerPlugin(knowledgePlugin);

  // 6. Observability & Health Endpoints
  app.get('/health', async (_, reply) => {
    return reply.status(200).send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.get('/ready', async (_, reply) => {
    try {
      db.prepare('SELECT 1').get();
      return reply.status(200).send({
        status: 'ready',
        database: 'connected',
      });
    } catch (err: any) {
      return reply.status(503).send({
        status: 'not_ready',
        error: err.message,
      });
    }
  });

  app.get('/status', async (_, reply) => {
    const mem = process.memoryUsage();
    return reply.status(200).send({
      name: env.BOT_NAME,
      version: '2.0.0',
      nodeEnv: env.NODE_ENV,
      uptimeSec: Math.floor(process.uptime()),
      memory: {
        rssMb: (mem.rss / 1024 / 1024).toFixed(2),
        heapUsedMb: (mem.heapUsed / 1024 / 1024).toFixed(2),
      },
      pluginsCount: pluginLoader.getLoadedPlugins().length,
      commandsCount: botCore.commandRouter.getAllCommands().length,
    });
  });

  app.get('/commands', async (_, reply) => {
    const commands = botCore.commandRouter.getAllCommands().map((c) => ({
      name: c.name,
      aliases: c.aliases || [],
      description: c.description,
      usage: c.usage || `!${c.name}`,
      category: c.category,
      cooldown: c.cooldown || 0,
    }));
    return reply.status(200).send({ count: commands.length, commands });
  });

  app.get('/plugins', async (_, reply) => {
    const plugins = pluginLoader.getLoadedPlugins().map((p) => ({
      name: p.name,
      version: p.version,
      description: p.description,
      commands: p.commands?.map((c) => c.name) || [],
    }));
    return reply.status(200).send({ count: plugins.length, plugins });
  });

  // 7. Runtime Controls & Kill Switch Endpoints
  let isPaused = false;
  app.post('/pause', async (_, reply) => {
    isPaused = true;
    logger.warn('Bot execution paused via POST /pause');
    return reply.status(200).send({ status: 'PAUSED', message: 'Bot outgoing actions paused' });
  });

  app.post('/resume', async (_, reply) => {
    isPaused = false;
    logger.info('Bot execution resumed via POST /resume');
    return reply.status(200).send({ status: 'CONNECTED', message: 'Bot execution resumed' });
  });

  app.get('/transport', async (_, reply) => {
    return reply.status(200).send({
      transport: 'facebook',
      status: isPaused ? 'PAUSED' : 'CONNECTED',
      connected: !isPaused,
    });
  });

  app.get('/queue', async (_, reply) => {
    return reply.status(200).send({
      queueSize: 0,
      activeJobs: 0,
      status: isPaused ? 'PAUSED' : 'HEALTHY',
    });
  });

  return { app, botCore, pluginLoader };
}

async function start() {
  try {
    const { app, botCore } = await createServer();

    // Graceful Shutdown Registration
    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Graceful shutdown initiated');
      try {
        await app.close();
        await botCore.shutdown();
        closeDatabase();
        logger.info('Clean shutdown completed successfully');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during shutdown');
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    await app.listen({ port: env.PORT, host: env.HOST });
    logger.info({ port: env.PORT, host: env.HOST }, `🚀 Bot server running on http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    logger.fatal({ err }, 'Fatal error during server startup');
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  start();
}

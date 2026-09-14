import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
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
import { ProcessedEventRepository } from './repositories/processed-event.repository.js';
import { InboundPipeline } from './pipeline/inbound-pipeline.js';
import { OutboundDispatcher } from './pipeline/outbound-dispatcher.js';
import { BotCore } from './core/bot.js';
import { SessionManager } from './core/session-manager.js';
import { FacebookAdapter } from './platform/facebook/adapter.js';
import { HealthMonitor } from './reliability/health-monitor.js';
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

export async function createServer(
  customDbPath?: string
): Promise<{ app: FastifyInstance; botCore: BotCore; pluginLoader: PluginLoader; healthMonitor: HealthMonitor }> {
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
  const healthMonitor = new HealthMonitor(env.BOT_ENABLED);
  const aiProvider =
    env.AI_PROVIDER === 'gemini' && env.AI_API_KEY
      ? new GeminiAIProvider(env.AI_API_KEY, env.AI_MODEL)
      : new MockAIProvider();
  const weatherService = new WeatherService(env.OPENWEATHER_API_KEY);

  const services: Record<string, any> = {
    aiProvider,
    weatherService,
    healthMonitor,
    commandRouter: null,
    inboundPipeline: null,
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
    sessionStore,
    healthMonitor,
  });
  services.commandRouter = botCore.commandRouter;

  // 4. Inbound pipeline (dedup -> persist -> bot core) + transport adapters
  const processedEvents = new ProcessedEventRepository(db);
  const inboundPipeline = new InboundPipeline({
    botCore,
    processedEvents,
    messageHistory: messageHistoryRepo,
  });
  services.inboundPipeline = inboundPipeline;

  // 4b. Facebook Transport Adapter (Page)
  const fbAdapter = new FacebookAdapter({
    pageAccessToken: env.FACEBOOK_PAGE_ACCESS_TOKEN,
    appSecret: env.FACEBOOK_APP_SECRET,
    verifyToken: env.FACEBOOK_VERIFY_TOKEN,
  });

  // 4c. Outbound dispatcher: reliability layer (priority queue + rate limit
  // + circuit breaker + kill-switch gate) in front of the transport sender.
  // Admin alerts use the RAW sender so they still deliver while paused.
  const outbound = new OutboundDispatcher(fbAdapter.sender, healthMonitor, {
    adminNotifier: async (text) => {
      try {
        await fbAdapter.sender.send(env.BOT_OWNER_ID, text);
      } catch {
        logger.error('Failed to deliver admin alert (owner may not have messaged the bot yet)');
      }
    },
  });
  services.outbound = outbound;

  fbAdapter.registerRoutes(app, (ctx) => inboundPipeline.accept(ctx), outbound);

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

  // 7. Runtime Controls & Kill Switch Endpoints (ADMIN_API_TOKEN guarded — audit S3)
  const assertAdminAuth = (req: FastifyRequest, reply: FastifyReply): boolean => {
    const token = (req.headers['x-admin-token'] as string) || '';
    if (!token || token !== env.ADMIN_API_TOKEN) {
      reply.status(401).send({ error: 'Unauthorized: invalid admin token' });
      return false;
    }
    return true;
  };

  app.post('/pause', async (req, reply) => {
    if (!assertAdminAuth(req, reply)) return;
    healthMonitor.pause('Paused via POST /pause');
    return reply.status(200).send({ status: 'PAUSED', message: 'Bot execution paused' });
  });

  app.post('/resume', async (req, reply) => {
    if (!assertAdminAuth(req, reply)) return;
    healthMonitor.resume();
    return reply.status(200).send({ status: 'CONNECTED', message: 'Bot execution resumed' });
  });

  app.get('/transport', async (_, reply) => {
    const hs = healthMonitor.getStatus();
    return reply.status(200).send({
      transport: 'facebook',
      status: hs.status,
      reason: hs.reason || undefined,
      connected: hs.botEnabled && hs.status === 'CONNECTED',
    });
  });

  app.get('/queue', async (_, reply) => {
    const stats = outbound.getStats();
    return reply.status(200).send({
      queueSize: stats.queued,
      activeJobs: stats.active,
      circuit: stats.circuit,
      status: stats.paused ? 'PAUSED' : stats.circuit === 'OPEN' ? 'DEGRADED' : 'HEALTHY',
    });
  });

  return { app, botCore, pluginLoader, healthMonitor };
}

async function start() {
  try {
    // Production fail-fast guards (audit S3/S4)
    if (env.NODE_ENV === 'production') {
      if (env.ADMIN_API_TOKEN === 'change_me_strong_random_admin_token') {
        throw new Error('ADMIN_API_TOKEN must be set to a strong random value in production');
      }
      // ENCRYPTION_KEY becomes mandatory once the personal transport (Phase 5) is active.
    }

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

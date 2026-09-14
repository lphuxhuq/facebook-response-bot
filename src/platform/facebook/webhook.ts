import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { FacebookParser } from './parser.js';
import { assertValidSignature } from './signature.js';
import { MessageContext } from '../../core/context.js';
import { WebhookPayload } from './types.js';
import { logger } from '../../utils/logger.js';

/**
 * Transport hands normalized contexts to the inbound pipeline.
 * Returning false means the message was ignored (e.g. duplicate).
 */
export type InboundHandler = (ctx: MessageContext) => Promise<boolean>;

export interface WebhookRouteOptions {
  verifyToken: string;
  appSecret: string;
  parser: FacebookParser;
  onMessage: InboundHandler;
}

export function registerFacebookWebhook(fastify: FastifyInstance, options: WebhookRouteOptions): void {
  const { verifyToken, appSecret, parser, onMessage } = options;

  // 1. Webhook Verification Endpoint (Meta Handshake)
  fastify.get('/webhook', async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as {
      'hub.mode'?: string;
      'hub.verify_token'?: string;
      'hub.challenge'?: string;
    };

    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (mode === 'subscribe' && token === verifyToken) {
      logger.info('Meta webhook verified successfully');
      return reply.status(200).send(challenge);
    }

    logger.warn({ mode, token }, 'Failed Meta webhook verification attempt');
    return reply.status(403).send('Forbidden: Invalid verification token');
  });

  // 2. Webhook Event Ingestion Endpoint
  fastify.post('/webhook', async (req: FastifyRequest, reply: FastifyReply) => {
    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    // Verify cryptographic HMAC-SHA256 signature
    try {
      assertValidSignature(rawBody, signature, appSecret);
    } catch (err: any) {
      logger.warn({ err: err.message }, 'Webhook signature verification failed');
      return reply.status(401).send('Unauthorized: Invalid HMAC signature');
    }

    // Immediately respond 200 OK to Meta to prevent timeout
    reply.status(200).send('EVENT_RECEIVED');

    // Parse and process events asynchronously
    try {
      const payload = req.body as WebhookPayload;
      const contexts = parser.parseWebhookPayload(payload);

      for (const ctx of contexts) {
        onMessage(ctx).catch((err) => {
          logger.error({ err, messageId: ctx.messageId }, 'Unhandled error processing webhook message');
        });
      }
    } catch (err) {
      logger.error({ err }, 'Error parsing incoming webhook payload');
    }
  });
}

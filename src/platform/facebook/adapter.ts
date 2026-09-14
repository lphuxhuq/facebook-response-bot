import { FastifyInstance } from 'fastify';
import { FacebookSender, MessageSender } from './sender.js';
import { FacebookParser } from './parser.js';
import { registerFacebookWebhook, InboundHandler } from './webhook.js';

export interface FacebookAdapterConfig {
  pageAccessToken: string;
  appSecret: string;
  verifyToken: string;
  apiVersion?: string;
  baseUrl?: string;
}

export class FacebookAdapter {
  public readonly sender: FacebookSender;
  public readonly parser: FacebookParser;
  private readonly appSecret: string;
  private readonly verifyToken: string;

  constructor(config: FacebookAdapterConfig) {
    this.sender = new FacebookSender({
      pageAccessToken: config.pageAccessToken,
      apiVersion: config.apiVersion,
      baseUrl: config.baseUrl,
      // The OutboundDispatcher provides priority queueing, per-thread
      // serialization, rate pacing, circuit breaking and bounded retries.
      // Disable the sender's own queue + backoff to avoid double-processing.
      useInternalQueue: false,
      transportRetry: false,
    });
    this.parser = new FacebookParser(this.sender);
    this.appSecret = config.appSecret;
    this.verifyToken = config.verifyToken;
  }

  /**
   * @param onMessage inbound handler (normally InboundPipeline.accept)
   * @param outbound  send path for created contexts; when a reliability
   *                  dispatcher is provided, it replaces the raw sender
   *                  inside every MessageContext closure.
   */
  registerRoutes(fastify: FastifyInstance, onMessage: InboundHandler, outbound?: MessageSender): void {
    const parser = outbound ? new FacebookParser(outbound) : this.parser;
    registerFacebookWebhook(fastify, {
      verifyToken: this.verifyToken,
      appSecret: this.appSecret,
      parser,
      onMessage,
    });
  }
}

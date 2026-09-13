import { FastifyInstance } from 'fastify';
import { FacebookSender } from './sender.js';
import { FacebookParser } from './parser.js';
import { registerFacebookWebhook } from './webhook.js';
import { BotCore } from '../../core/bot.js';

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
    });
    this.parser = new FacebookParser(this.sender);
    this.appSecret = config.appSecret;
    this.verifyToken = config.verifyToken;
  }

  registerRoutes(fastify: FastifyInstance, botCore: BotCore): void {
    registerFacebookWebhook(fastify, {
      verifyToken: this.verifyToken,
      appSecret: this.appSecret,
      parser: this.parser,
      botCore,
    });
  }
}

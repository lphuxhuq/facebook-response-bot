import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../src/app.js';
import { FastifyInstance } from 'fastify';
import { closeDatabase } from '../src/database/index.js';

describe('Fastify HTTP Server & Observability Endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const server = await createServer();
    app = server.app;
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    closeDatabase();
  });

  it('GET /health should return status ok', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');
    expect(typeof body.uptime).toBe('number');
  });

  it('GET /ready should verify database readiness', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/ready',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ready');
    expect(body.database).toBe('connected');
  });

  it('GET /status should return process and memory metrics', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/status',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.version).toBe('2.0.0');
    expect(body.pluginsCount).toBeGreaterThanOrEqual(5);
    expect(body.commandsCount).toBeGreaterThanOrEqual(10);
  });

  it('GET /commands should return list of registered commands', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/commands',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.count).toBeGreaterThanOrEqual(10);

    const names = body.commands.map((c: any) => c.name);
    expect(names).toContain('ping');
    expect(names).toContain('help');
    expect(names).toContain('admin');
    expect(names).toContain('bank');
    expect(names).toContain('ai');
    expect(names).toContain('quiz');
  });

  it('GET /plugins should return loaded plugins info', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/plugins',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.count).toBe(6);
    const pluginNames = body.plugins.map((p: any) => p.name);
    expect(pluginNames).toContain('core');
    expect(pluginNames).toContain('admin');
    expect(pluginNames).toContain('utility');
    expect(pluginNames).toContain('economy');
    expect(pluginNames).toContain('entertainment');
    expect(pluginNames).toContain('ai');
  });
});

import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { ConversationRepository } from '../src/database/conversation.repository';
import { FlowRouterService } from '../src/flows/flow-router.service';

describe('API (e2e)', () => {
  let app: INestApplication;
  const route = jest.fn();

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ConversationRepository)
      .useValue({
        ensureConversation: jest.fn().mockResolvedValue(undefined),
        saveInteraction: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(FlowRouterService)
      .useValue({ route })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(() => app.close());

  it('reports health', () => request(app.getHttpServer()).get('/health').expect(200, { status: 'ok' }));

  it('reports unavailable readiness when dependencies are not configured', () =>
    request(app.getHttpServer()).get('/health/ready').expect(503));

  it('returns an orchestrated message', async () => {
    route.mockResolvedValueOnce({
      route: 'support',
      content: 'Deseja falar com um atendente humano?',
      next: { mode: 'BOT', activeFlow: 'SUPPORT', step: 'OFFERING_HUMAN_SUPPORT', context: {} },
    });
    const sessionId = '123e4567-e89b-42d3-a456-426614174000';
    const conversationId = '123e4567-e89b-42d3-a456-426614174001';
    const response = await request(app.getHttpServer())
      .post('/messages')
      .set('x-correlation-id', 'corr-e2e')
      .send({ message: 'Olá', sessionId, conversationId })
      .expect(201);

    expect(response.body).toMatchObject({
      correlationId: 'corr-e2e',
      sessionId,
      conversationId,
      route: 'support',
      content: 'Deseja falar com um atendente humano?',
      model: 'flow-engine-v1',
      handledBy: 'bot',
    });
    expect(response.headers['x-correlation-id']).toBe('corr-e2e');
  });

  it('rejects invalid input', () =>
    request(app.getHttpServer()).post('/messages').send({ message: '' }).expect(400));

  it('streams an orchestrated message as NDJSON', async () => {
    route.mockResolvedValueOnce({
      route: 'cancel',
      content: 'Informe o localizador.',
      next: { mode: 'BOT', activeFlow: 'CANCEL', step: 'WAITING_CANCEL_LOCATOR', context: {} },
    });

    const response = await request(app.getHttpServer())
      .post('/messages/stream')
      .set('x-correlation-id', 'corr-stream')
      .send({ message: 'Olá' })
      .expect(200)
      .expect('content-type', /application\/x-ndjson/);

    const events = response.text.trim().split('\n').map((line) => JSON.parse(line));
    expect(events[0]).toEqual({ type: 'delta', content: 'Informe o localizador.' });
    expect(events[1]).toMatchObject({
      type: 'done',
      correlationId: 'corr-stream',
      route: 'cancel',
      content: 'Informe o localizador.',
      model: 'flow-engine-v1',
    });
  });

  it('returns no delta while human attendance owns the conversation', async () => {
    route.mockResolvedValueOnce({
      route: 'human_silent', content: null,
      next: { mode: 'HUMAN', activeFlow: 'SUPPORT', step: 'HUMAN', context: {} },
    });
    const response = await request(app.getHttpServer())
      .post('/messages/stream')
      .send({ message: 'Olá?' })
      .expect(200);
    const events = response.text.trim().split('\n').map((line) => JSON.parse(line));
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: 'done', route: 'human_silent', handledBy: 'human', content: '',
    });
  });

  it('exposes essential metrics without message content', async () => {
    const response = await request(app.getHttpServer()).get('/metrics').expect(200);
    expect(response.text).toContain('chatbot_http_requests_total');
    expect(response.text).not.toContain('Resposta local');
  });
});

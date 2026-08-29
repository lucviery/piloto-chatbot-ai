import {
  GatewayTimeoutException,
  INestApplication,
  ServiceUnavailableException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { LlmService } from '../src/llm/llm.service';
import { ConversationRepository } from '../src/database/conversation.repository';
import { RagService } from '../src/rag/rag.service';

describe('API (e2e)', () => {
  let app: INestApplication;
  const generate = jest.fn();

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(LlmService)
      .useValue({ generate })
      .overrideProvider(ConversationRepository)
      .useValue({ saveInteraction: jest.fn().mockResolvedValue(undefined) })
      .overrideProvider(RagService)
      .useValue({ retrieve: jest.fn().mockResolvedValue({ context: '', sources: [] }) })
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
    generate.mockResolvedValueOnce({ content: 'Resposta local', model: 'test-model' });
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
      route: 'direct',
      content: 'Resposta local',
      model: 'test-model',
    });
    expect(response.headers['x-correlation-id']).toBe('corr-e2e');
  });

  it('rejects invalid input', () =>
    request(app.getHttpServer()).post('/messages').send({ message: '' }).expect(400));

  it('returns 504 when the model times out', () => {
    generate.mockRejectedValueOnce(
      new GatewayTimeoutException({ code: 'LLM_TIMEOUT', message: 'O modelo excedeu o limite.' }),
    );
    return request(app.getHttpServer()).post('/messages').send({ message: 'Olá' }).expect(504);
  });

  it('returns 503 when the model is unavailable', () => {
    generate.mockRejectedValueOnce(
      new ServiceUnavailableException({
        code: 'LLM_UNAVAILABLE',
        message: 'O modelo não está disponível.',
      }),
    );
    return request(app.getHttpServer()).post('/messages').send({ message: 'Olá' }).expect(503);
  });

  it('exposes essential metrics without message content', async () => {
    const response = await request(app.getHttpServer()).get('/metrics').expect(200);
    expect(response.text).toContain('chatbot_http_requests_total');
    expect(response.text).not.toContain('Resposta local');
  });
});

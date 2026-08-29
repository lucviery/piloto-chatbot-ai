import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { LlmService } from '../src/llm/llm.service';

describe('API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(LlmService)
      .useValue({ generate: jest.fn().mockResolvedValue({ content: 'Resposta local', model: 'test-model' }) })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(() => app.close());

  it('reports health', () => request(app.getHttpServer()).get('/health').expect(200, { status: 'ok' }));

  it('returns an orchestrated message', async () => {
    const response = await request(app.getHttpServer())
      .post('/messages')
      .set('x-correlation-id', 'corr-e2e')
      .send({ message: 'Olá' })
      .expect(201);

    expect(response.body).toMatchObject({
      correlationId: 'corr-e2e',
      route: 'direct',
      content: 'Resposta local',
      model: 'test-model',
    });
  });

  it('rejects invalid input', () =>
    request(app.getHttpServer()).post('/messages').send({ message: '' }).expect(400));
});

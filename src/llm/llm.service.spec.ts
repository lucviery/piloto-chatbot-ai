import { GatewayTimeoutException, ServiceUnavailableException } from '@nestjs/common';
import { LlmService } from './llm.service';

describe('LlmService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('maps a successful Ollama response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        model: 'deepseek-test',
        message: { content: ' Resposta ' },
      }),
    });

    await expect(new LlmService().generate({ message: 'Olá' })).resolves.toEqual({
      content: 'Resposta',
      model: 'deepseek-test',
    });
  });

  it('returns an explicit unavailable error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('connection refused'));

    await expect(new LlmService().generate({ message: 'Olá' })).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('returns an explicit timeout error', async () => {
    const timeout = new Error('timed out');
    timeout.name = 'TimeoutError';
    global.fetch = jest.fn().mockRejectedValue(timeout);

    await expect(new LlmService().generate({ message: 'Olá' })).rejects.toBeInstanceOf(
      GatewayTimeoutException,
    );
  });
});

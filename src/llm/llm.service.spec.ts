import { GatewayTimeoutException, ServiceUnavailableException } from '@nestjs/common';
import { LlmService } from './llm.service';

describe('LlmService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('maps a successful Ollama response', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        model: 'deepseek-test',
        message: { content: ' Resposta ' },
      }),
    });
    global.fetch = fetchMock;

    await expect(new LlmService().generate({ message: 'Olá' })).resolves.toEqual({
      content: 'Resposta',
      model: 'deepseek-test',
    });

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(request.body as string) as {
      messages: Array<{ role: string; content: string }>;
      options: { temperature: number };
    };
    expect(body.messages).toEqual([
      expect.objectContaining({
        role: 'system',
        content: expect.stringContaining('português brasileiro'),
      }),
      { role: 'user', content: 'Olá' },
    ]);
    expect(body.options.temperature).toBe(0.2);
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

  it('streams Ollama response fragments and returns the complete result', async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('{"model":"deepseek-test","message":{"content":"Olá"}}\n'));
        controller.enqueue(encoder.encode('{"model":"deepseek-test","message":{"content":"!"},"done":true}\n'));
        controller.close();
      },
    });
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, body });
    global.fetch = fetchMock;
    const deltas: string[] = [];

    await expect(
      new LlmService().generateStream({ message: 'Oi' }, (delta) => deltas.push(delta)),
    ).resolves.toEqual({ content: 'Olá!', model: 'deepseek-test' });
    expect(deltas).toEqual(['Olá', '!']);

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    const requestBody = JSON.parse(request.body as string) as {
      stream: boolean;
      options: { num_predict: number };
    };
    expect(requestBody.stream).toBe(true);
    expect(requestBody.options.num_predict).toBe(256);
  });
});

import { ToolExecutionError } from '../tools.types';
import { MegaueChatbotClient } from './megaue-chatbot.client';

describe('MegaueChatbotClient', () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.MEGAUE_API_BASE_URL;

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalBaseUrl === undefined) delete process.env.MEGAUE_API_BASE_URL;
    else process.env.MEGAUE_API_BASE_URL = originalBaseUrl;
    jest.restoreAllMocks();
  });

  it('encodes locator query parameters', async () => {
    process.env.MEGAUE_API_BASE_URL = 'https://api.example.test';
    global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({
      orderId: 1,
      value: '10,00',
      eventName: 'Evento',
      status: 'CONFIRM',
      locators: ['A B'],
    }), { status: 200, headers: { 'content-type': 'application/json' } }));

    await new MegaueChatbotClient().searchByLocator('A B');

    expect(global.fetch).toHaveBeenCalledWith(
      new URL('https://api.example.test/api/chatbot/search-by-locator?locator=A+B'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('maps a 422 detail to a safe typed error', async () => {
    process.env.MEGAUE_API_BASE_URL = 'https://api.example.test';
    global.fetch = jest.fn().mockResolvedValue(new Response(
      JSON.stringify({ detail: 'Localizador não encontrado' }),
      { status: 422, headers: { 'content-type': 'application/json' } },
    ));

    await expect(new MegaueChatbotClient().searchByLocator('ABC')).rejects.toMatchObject({
      code: 'MEGAUE_VALIDATION_ERROR',
      message: 'Localizador não encontrado',
      retryable: false,
      status: 422,
    });
  });

  it('fails explicitly when the base URL is not configured', async () => {
    delete process.env.MEGAUE_API_BASE_URL;
    await expect(new MegaueChatbotClient().searchByLocator('ABC')).rejects.toBeInstanceOf(ToolExecutionError);
  });
});

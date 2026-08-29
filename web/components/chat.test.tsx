import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Chat, createClientId } from './chat';

describe('Chat', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('creates a local id when randomUUID is unavailable over HTTP', () => {
    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', { value: {}, configurable: true });
    expect(createClientId()).toMatch(/^local-/);
    Object.defineProperty(globalThis, 'crypto', { value: originalCrypto, configurable: true });
  });

  it('sends a message and renders the answer', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        id: 'answer-1',
        sessionId: 'session-1',
        conversationId: 'conversation-1',
        correlationId: 'correlation-1',
        content: 'Olá! Como posso ajudar?',
        model: 'deepseek-test',
        sources: [{ title: 'Manual', url: 'https://dokuwiki.megaue.com.br/manual' }],
      }),
    }));
    const user = userEvent.setup();
    render(<Chat />);

    await user.type(screen.getByLabelText('Digite sua mensagem'), 'Olá');
    await user.click(screen.getByLabelText('Enviar mensagem'));

    expect(screen.getByText('Olá')).toBeInTheDocument();
    expect(await screen.findByText('Olá! Como posso ajudar?')).toBeInTheDocument();
    expect(screen.getByText('deepseek-test')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Manual' })).toHaveAttribute(
      'href',
      'https://dokuwiki.megaue.com.br/manual',
    );
  });

  it('shows an understandable error and retries', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ message: 'Serviço indisponível.' }) })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'answer-2', sessionId: 'session-1', conversationId: 'conversation-1',
          correlationId: 'correlation-2', content: 'Recuperado', model: 'deepseek-test',
        }),
      });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<Chat />);

    await user.type(screen.getByLabelText('Digite sua mensagem'), 'Teste');
    await user.click(screen.getByLabelText('Enviar mensagem'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Serviço indisponível.');

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('Recuperado')).toBeInTheDocument();
    expect(screen.getAllByText('Teste')).toHaveLength(1);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});

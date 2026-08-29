'use client';

import { FormEvent, KeyboardEvent, useRef, useState } from 'react';

interface ApiResponse {
  id: string;
  sessionId: string;
  conversationId: string;
  correlationId: string;
  content: string;
  model: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
}

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [value, setValue] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionId = useRef<string | undefined>(undefined);
  const conversationId = useRef<string | undefined>(undefined);
  const lastMessage = useRef('');

  async function send(message: string, appendUser = true): Promise<void> {
    const trimmed = message.trim();
    if (!trimmed || pending) return;

    lastMessage.current = trimmed;
    setError(null);
    setPending(true);
    setValue('');
    if (appendUser) {
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: 'user', content: trimmed },
      ]);
    }

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          sessionId: sessionId.current,
          conversationId: conversationId.current,
        }),
      });
      const body = (await response.json()) as ApiResponse & { message?: string };
      if (!response.ok) throw new Error(body.message ?? 'Não foi possível obter uma resposta.');

      sessionId.current = body.sessionId;
      conversationId.current = body.conversationId;
      setMessages((current) => [
        ...current,
        { id: body.id, role: 'assistant', content: body.content, model: body.model },
      ]);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'O assistente está indisponível. Tente novamente.',
      );
    } finally {
      setPending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void send(value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <section className="chat-panel" aria-label="Conversa com o assistente">
      <div className="messages" role="log" aria-live="polite" aria-relevant="additions">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>Experimente começar com:</p>
            <button type="button" onClick={() => void send('Olá! O que você pode fazer?')}>
              “Olá! O que você pode fazer?”
            </button>
          </div>
        ) : (
          messages.map((message) => (
            <article className={`message ${message.role}`} key={message.id}>
              <span className="message-label">
                {message.role === 'user' ? 'Você' : 'Assistente'}
              </span>
              <p>{message.content}</p>
              {message.model ? <small>{message.model}</small> : null}
            </article>
          ))
        )}
        {pending ? (
          <div className="thinking" role="status">
            <span /><span /><span />
            <span className="sr-only">O assistente está elaborando a resposta.</span>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void send(lastMessage.current, false)} disabled={pending}>
            Tentar novamente
          </button>
        </div>
      ) : null}

      <form className="composer" onSubmit={submit}>
        <label className="sr-only" htmlFor="message">Digite sua mensagem</label>
        <textarea
          id="message"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva uma mensagem..."
          maxLength={4000}
          rows={1}
          disabled={pending}
        />
        <button type="submit" disabled={pending || !value.trim()} aria-label="Enviar mensagem">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m4 4 17 8-17 8 3-8-3-8Zm3.3 2.9 1.7 4.1h7.4L7.3 6.9ZM9 13l-1.7 4.1 9.1-4.1H9Z" />
          </svg>
        </button>
        <p className="composer-hint">Enter envia · Shift + Enter quebra a linha</p>
      </form>
    </section>
  );
}

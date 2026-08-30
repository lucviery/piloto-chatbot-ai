'use client';

import { FormEvent, KeyboardEvent, useRef, useState } from 'react';

interface ApiResponse {
  id: string;
  sessionId: string;
  conversationId: string;
  correlationId: string;
  content: string;
  model: string;
  route?: 'cancel' | 'support' | 'human_handoff' | 'human_silent';
  handledBy?: 'bot' | 'human';
  sources?: { title: string; url: string }[];
}

type StreamEvent =
  | { type: 'delta'; content: string }
  | ({ type: 'done' } & ApiResponse)
  | { type: 'error'; error?: { message?: string } | string };

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  sources?: { title: string; url: string }[];
}

export function createClientId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [value, setValue] = useState('');
  const [pending, setPending] = useState(false);
  const [receiving, setReceiving] = useState(false);
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
        { id: createClientId(), role: 'user', content: trimmed },
      ]);
    }

    try {
      const assistantId = `assistant-${createClientId()}`;
      let assistantAdded = false;
      let completed = false;
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          sessionId: sessionId.current,
          conversationId: conversationId.current,
        }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message ?? 'Não foi possível obter uma resposta.');
      }
      if (!response.body) throw new Error('O servidor não iniciou a resposta.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffered = '';

      const consumeLine = (line: string): void => {
        if (!line.trim()) return;
        const event = JSON.parse(line) as StreamEvent;
        if (event.type === 'delta') {
          if (!assistantAdded) {
            assistantAdded = true;
            setReceiving(true);
            setMessages((current) => [
              ...current,
              { id: assistantId, role: 'assistant', content: event.content },
            ]);
          } else {
            setMessages((current) => current.map((item) =>
              item.id === assistantId ? { ...item, content: item.content + event.content } : item,
            ));
          }
          return;
        }
        if (event.type === 'error') {
          const message = typeof event.error === 'string' ? event.error : event.error?.message;
          throw new Error(message ?? 'A resposta foi interrompida.');
        }

        completed = true;
        sessionId.current = event.sessionId;
        conversationId.current = event.conversationId;
        if (event.handledBy === 'human' && !event.content) return;
        if (assistantAdded) {
          setMessages((current) => current.map((item) =>
            item.id === assistantId
              ? { ...item, id: event.id, content: event.content, model: event.model, sources: event.sources }
              : item,
          ));
        } else {
          assistantAdded = true;
          setMessages((current) => [
            ...current,
            { id: event.id, role: 'assistant', content: event.content, model: event.model, sources: event.sources },
          ]);
        }
      };

      while (true) {
        const { done, value: chunk } = await reader.read();
        buffered += decoder.decode(chunk, { stream: !done });
        const lines = buffered.split('\n');
        buffered = lines.pop() ?? '';
        for (const line of lines) consumeLine(line);
        if (done) break;
      }
      consumeLine(buffered);
      if (!completed) throw new Error('A resposta foi interrompida antes de terminar.');
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'O assistente está indisponível. Tente novamente.',
      );
    } finally {
      setPending(false);
      setReceiving(false);
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
              {message.sources?.length ? (
                <ul className="sources" aria-label="Fontes da resposta">
                  {message.sources.map((source) => (
                    <li key={source.url}>
                      <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))
        )}
        {pending && !receiving ? (
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

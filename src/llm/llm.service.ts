import {
  GatewayTimeoutException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GenerateRequest, GenerateResult, LlmProvider } from './llm.types';

interface OllamaChatResponse {
  model?: string;
  message?: { content?: string };
  done?: boolean;
}

@Injectable()
export class LlmService implements LlmProvider {
  private static readonly systemPrompt = [
    'Você é o assistente virtual da Megauê.',
    'Responda sempre em português brasileiro (pt-BR), com linguagem natural, clara e objetiva.',
    'Não troque de idioma, exceto quando o usuário pedir explicitamente.',
    'Não invente informações nem nomes de telas, botões ou sistemas. Quando não souber ou não houver contexto suficiente, diga isso claramente.',
    'Se for uma orientação de procedimento, use no máximo 3 passos curtos e 80 palavras. Não mostre raciocínio ou texto de análise.',
  ].join(' ');

  private readonly baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://ollama:11434';
  private readonly model = process.env.OLLAMA_MODEL ?? 'deepseek-r1:7b';
  private readonly timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS ?? 180000);
  private readonly maxOutputTokens = Number(process.env.OLLAMA_NUM_PREDICT ?? 256);
  private readonly temperature = Number(process.env.OLLAMA_TEMPERATURE ?? 0.2);

  private requestBody(message: string, stream: boolean): string {
    return JSON.stringify({
      model: this.model,
      stream,
      think: false,
      messages: [
        { role: 'system', content: LlmService.systemPrompt },
        { role: 'user', content: message },
      ],
      options: {
        num_predict: this.maxOutputTokens,
        temperature: this.temperature,
      },
    });
  }

  async generate(request: GenerateRequest): Promise<GenerateResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: this.requestBody(request.message, false),
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) {
        throw new ServiceUnavailableException({
          code: 'LLM_UNAVAILABLE',
          message: 'O modelo local não está disponível no momento.',
        });
      }

      const result = (await response.json()) as OllamaChatResponse;
      const content = result.message?.content?.trim();
      if (!content) {
        throw new ServiceUnavailableException({
          code: 'LLM_EMPTY_RESPONSE',
          message: 'O modelo local não produziu uma resposta válida.',
        });
      }

      return { content, model: result.model ?? this.model };
    } catch (error: unknown) {
      if (error instanceof ServiceUnavailableException) throw error;
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new GatewayTimeoutException({
          code: 'LLM_TIMEOUT',
          message: 'O modelo local excedeu o tempo limite.',
        });
      }
      throw new ServiceUnavailableException({
        code: 'LLM_UNAVAILABLE',
        message: 'Não foi possível acessar o modelo local.',
      });
    }
  }

  async generateStream(
    request: GenerateRequest,
    onDelta: (delta: string) => void,
  ): Promise<GenerateResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: this.requestBody(request.message, true),
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok || !response.body) {
        throw new ServiceUnavailableException({
          code: 'LLM_UNAVAILABLE',
          message: 'O modelo local não está disponível no momento.',
        });
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffered = '';
      let content = '';
      let model = this.model;
      let emittedContent = false;

      const consumeLine = (line: string): void => {
        if (!line.trim()) return;
        const chunk = JSON.parse(line) as OllamaChatResponse;
        model = chunk.model ?? model;
        const delta = chunk.message?.content ?? '';
        if (delta) {
          content += delta;
          const visibleDelta = emittedContent ? delta : delta.replace(/^\s+/, '');
          if (visibleDelta) {
            emittedContent = true;
            onDelta(visibleDelta);
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        buffered += decoder.decode(value, { stream: !done });
        const lines = buffered.split('\n');
        buffered = lines.pop() ?? '';
        for (const line of lines) consumeLine(line);
        if (done) break;
      }
      consumeLine(buffered);

      const normalized = content.trim();
      if (!normalized) {
        throw new ServiceUnavailableException({
          code: 'LLM_EMPTY_RESPONSE',
          message: 'O modelo local não produziu uma resposta válida.',
        });
      }
      return { content: normalized, model };
    } catch (error: unknown) {
      if (error instanceof ServiceUnavailableException) throw error;
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new GatewayTimeoutException({
          code: 'LLM_TIMEOUT',
          message: 'O modelo local excedeu o tempo limite.',
        });
      }
      throw new ServiceUnavailableException({
        code: 'LLM_UNAVAILABLE',
        message: 'Não foi possível acessar o modelo local.',
      });
    }
  }
}

import {
  GatewayTimeoutException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GenerateRequest, GenerateResult, LlmProvider } from './llm.types';

interface OllamaChatResponse {
  model?: string;
  message?: { content?: string };
}

@Injectable()
export class LlmService implements LlmProvider {
  private readonly baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://ollama:11434';
  private readonly model = process.env.OLLAMA_MODEL ?? 'deepseek-r1:7b';
  private readonly timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS ?? 180000);
  private readonly maxOutputTokens = Number(process.env.OLLAMA_NUM_PREDICT ?? 768);

  async generate(request: GenerateRequest): Promise<GenerateResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          stream: false,
          think: false,
          messages: [{ role: 'user', content: request.message }],
          options: { num_predict: this.maxOutputTokens },
        }),
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
}

import { Injectable, ServiceUnavailableException } from '@nestjs/common';

interface EmbedResponse {
  embeddings?: number[][];
}

@Injectable()
export class EmbeddingService {
  private readonly baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://ollama:11434';
  private readonly model = process.env.EMBEDDING_MODEL ?? 'embeddinggemma:latest';

  async embed(input: string[]): Promise<number[][]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/embed`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: this.model, input }),
        signal: AbortSignal.timeout(120000),
      });
      if (!response.ok) throw new Error(`Ollama embed returned ${response.status}`);
      const body = (await response.json()) as EmbedResponse;
      if (!body.embeddings || body.embeddings.length !== input.length) throw new Error('Invalid embeddings');
      return body.embeddings;
    } catch {
      throw new ServiceUnavailableException({
        code: 'EMBEDDING_UNAVAILABLE',
        message: 'Não foi possível consultar o índice documental.',
      });
    }
  }
}


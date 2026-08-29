import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Controller('health')
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready(): Promise<{ status: 'ok'; dependencies: { database: 'ok'; ollama: 'ok' } }> {
    try {
      await this.database.query('SELECT 1');
      const ollamaUrl = process.env.OLLAMA_BASE_URL ?? 'http://ollama:11434';
      const response = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error('Ollama unhealthy');
      return { status: 'ok', dependencies: { database: 'ok', ollama: 'ok' } };
    } catch {
      throw new ServiceUnavailableException({
        code: 'DEPENDENCY_UNAVAILABLE',
        message: 'Uma dependência obrigatória não está disponível.',
      });
    }
  }
}

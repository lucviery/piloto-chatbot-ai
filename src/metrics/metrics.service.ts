import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private requests = 0;
  private errors = 0;
  private durationMs = 0;

  observe(statusCode: number, durationMs: number): void {
    this.requests += 1;
    this.durationMs += durationMs;
    if (statusCode >= 500) this.errors += 1;
  }

  render(): string {
    return [
      '# HELP chatbot_http_requests_total Total de requisições HTTP.',
      '# TYPE chatbot_http_requests_total counter',
      `chatbot_http_requests_total ${this.requests}`,
      '# HELP chatbot_http_errors_total Total de respostas HTTP 5xx.',
      '# TYPE chatbot_http_errors_total counter',
      `chatbot_http_errors_total ${this.errors}`,
      '# HELP chatbot_http_request_duration_ms_sum Soma da duração das requisições em ms.',
      '# TYPE chatbot_http_request_duration_ms_sum counter',
      `chatbot_http_request_duration_ms_sum ${this.durationMs}`,
      '',
    ].join('\n');
  }
}


import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';

export interface RequestWithContext extends Request {
  correlationId: string;
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HttpRequest');

  use(request: RequestWithContext, response: Response, next: NextFunction): void {
    const header = request.header('x-correlation-id');
    request.correlationId = header && /^[A-Za-z0-9._:-]{1,128}$/.test(header) ? header : randomUUID();
    response.setHeader('x-correlation-id', request.correlationId);
    const startedAt = Date.now();

    response.on('finish', () => {
      this.logger.log(
        JSON.stringify({
          event: 'http_request_completed',
          correlationId: request.correlationId,
          method: request.method,
          path: request.path,
          statusCode: response.statusCode,
          durationMs: Date.now() - startedAt,
        }),
      );
    });

    next();
  }
}


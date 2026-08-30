import { Body, Controller, HttpException, Post, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { RequestWithContext } from '../common/request-context.middleware';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageResponse, OrchestratorService } from './orchestrator.service';

@Controller('messages')
export class OrchestratorController {
  constructor(private readonly orchestrator: OrchestratorService) {}

  @Post()
  send(
    @Body() input: SendMessageDto,
    @Req() request: RequestWithContext,
  ): Promise<MessageResponse> {
    return this.orchestrator.respond(input, request.correlationId);
  }

  @Post('stream')
  async stream(
    @Body() input: SendMessageDto,
    @Req() request: RequestWithContext,
    @Res() response: Response,
  ): Promise<void> {
    const writeEvent = (event: unknown): void => {
      if (!response.headersSent) {
        response.status(200);
        response.setHeader('content-type', 'application/x-ndjson; charset=utf-8');
        response.setHeader('cache-control', 'no-cache, no-transform');
        response.flushHeaders();
      }
      response.write(`${JSON.stringify(event)}\n`);
    };

    try {
      const result = await this.orchestrator.respondStreaming(
        input,
        request.correlationId,
        (content) => writeEvent({ type: 'delta', content }),
      );
      writeEvent({ type: 'done', ...result });
      response.end();
    } catch (error: unknown) {
      if (!response.headersSent) throw error;
      const payload = error instanceof HttpException
        ? error.getResponse()
        : { code: 'STREAM_FAILED', message: 'A resposta foi interrompida.' };
      writeEvent({ type: 'error', error: payload });
      response.end();
    }
  }
}

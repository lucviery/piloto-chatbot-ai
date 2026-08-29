import { Body, Controller, Post, Req } from '@nestjs/common';
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
}

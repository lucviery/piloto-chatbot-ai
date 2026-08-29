import { Body, Controller, Headers, Post } from '@nestjs/common';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageResponse, OrchestratorService } from './orchestrator.service';

@Controller('messages')
export class OrchestratorController {
  constructor(private readonly orchestrator: OrchestratorService) {}

  @Post()
  send(
    @Body() input: SendMessageDto,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<MessageResponse> {
    return this.orchestrator.respond(input.message, correlationId);
  }
}


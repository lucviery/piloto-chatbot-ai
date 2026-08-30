import {
  Controller,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { HumanAttendanceService } from './human-attendance.service';

@Controller('internal/attendance')
export class HumanAttendanceController {
  constructor(private readonly attendance: HumanAttendanceService) {}

  @Post(':conversationId/close')
  async close(
    @Param('conversationId', new ParseUUIDPipe()) conversationId: string,
    @Headers('x-internal-token') suppliedToken?: string,
  ): Promise<{ conversationId: string; mode: 'BOT'; step: 'IDLE' }> {
    this.authorize(suppliedToken);
    const state = await this.attendance.close(conversationId);
    return { conversationId: state.conversationId, mode: 'BOT', step: 'IDLE' };
  }

  private authorize(suppliedToken?: string): void {
    const expectedToken = process.env.INTERNAL_API_TOKEN;
    if (!expectedToken) {
      throw new ServiceUnavailableException({
        code: 'INTERNAL_API_NOT_CONFIGURED',
        message: 'A integração interna de atendimento não está configurada.',
      });
    }
    const expected = Buffer.from(expectedToken);
    const supplied = Buffer.from(suppliedToken ?? '');
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
      throw new UnauthorizedException({ code: 'INVALID_INTERNAL_TOKEN', message: 'Acesso não autorizado.' });
    }
  }
}

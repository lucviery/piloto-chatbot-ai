import { ConversationStateRepository } from '../database/conversation-state.repository';
import { HumanAttendanceService } from './human-attendance.service';

describe('HumanAttendanceService', () => {
  it('explicitly restores a human conversation to BOT/IDLE', async () => {
    const human = {
      conversationId: '11111111-1111-4111-8111-111111111111',
      mode: 'HUMAN' as const,
      activeFlow: 'SUPPORT' as const,
      step: 'HUMAN' as const,
      context: { supportMessage: 'Ajuda' },
      version: 8,
      updatedAt: new Date(),
    };
    const idle = { ...human, mode: 'BOT', activeFlow: null, step: 'IDLE', context: {}, version: 9 };
    const transition = jest.fn().mockResolvedValue(idle);
    const service = new HumanAttendanceService({
      find: jest.fn().mockResolvedValue(human), transition,
    } as unknown as ConversationStateRepository);

    const result = await service.close(human.conversationId);

    expect(transition).toHaveBeenCalledWith(human.conversationId, 8, {
      mode: 'BOT', activeFlow: null, step: 'IDLE', context: {},
    });
    expect(result).toEqual(idle);
  });
});

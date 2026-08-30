import { SearchOrderByLocatorTool } from '../../tools/megaue/cancel.tools';
import { NotifyHumanSupportTool } from '../../tools/support/notify-human-support.tool';
import { ToolExecutionError } from '../../tools/tools.types';
import { ConversationState } from '../flow.types';
import { SupportFlowHandler } from './support-flow.handler';

const state = (overrides: Partial<ConversationState> = {}): ConversationState => ({
  conversationId: '11111111-1111-4111-8111-111111111111',
  mode: 'BOT',
  activeFlow: 'SUPPORT',
  step: 'OFFERING_HUMAN_SUPPORT',
  context: {},
  version: 0,
  updatedAt: new Date(),
  ...overrides,
});
const toolContext = { correlationId: 'corr-1' };

describe('SupportFlowHandler', () => {
  const search = { execute: jest.fn() };
  const notify = { execute: jest.fn() };
  const handler = new SupportFlowHandler(
    search as unknown as SearchOrderByLocatorTool,
    notify as unknown as NotifyHumanSupportTool,
  );

  beforeEach(() => jest.clearAllMocks());

  it('asks for an optional locator after the user accepts', async () => {
    const result = await handler.handle(state(), 'sim', toolContext);
    expect(result.next.step).toBe('WAITING_SUPPORT_LOCATOR');
    expect(result.content).toContain('digite 0');
  });

  it('ends the offer when the user refuses', async () => {
    const result = await handler.handle(state(), 'não', toolContext);
    expect(result.next).toEqual({ mode: 'BOT', activeFlow: null, step: 'IDLE', context: {} });
  });

  it('skips the locator without calling the API', async () => {
    const result = await handler.handle(state({ step: 'WAITING_SUPPORT_LOCATOR' }), '0', toolContext);
    expect(search.execute).not.toHaveBeenCalled();
    expect(result.next.step).toBe('WAITING_SUPPORT_MESSAGE');
  });

  it('accepts an order for support regardless of its status', async () => {
    search.execute.mockResolvedValue({
      data: { orderId: 20, value: '10,00', eventName: 'Evento', status: 'CANCEL', locators: ['XYZ'] },
    });
    const result = await handler.handle(state({ step: 'WAITING_SUPPORT_LOCATOR' }), 'XYZ', toolContext);
    expect(result.next.step).toBe('WAITING_SUPPORT_MESSAGE');
    expect(result.next.context.orderStatus).toBe('CANCEL');
  });

  it('changes to HUMAN only after successful notification', async () => {
    notify.execute.mockResolvedValue({ data: { delivered: true }, source: 'support' });
    const result = await handler.handle(state({
      step: 'WAITING_SUPPORT_MESSAGE',
      context: { locator: 'XYZ', orderId: 20 },
    }), 'Preciso de ajuda', toolContext);

    expect(notify.execute).toHaveBeenCalledWith(expect.objectContaining({
      conversationId: state().conversationId,
      message: 'Preciso de ajuda',
      orderId: 20,
    }), toolContext);
    expect(result).toMatchObject({
      route: 'human_handoff',
      next: { mode: 'HUMAN', activeFlow: 'SUPPORT', step: 'HUMAN' },
    });
  });

  it('does not change to HUMAN when notification fails', async () => {
    notify.execute.mockRejectedValue(new ToolExecutionError('FAILED', 'Canal indisponível', true));
    const current = state({ step: 'WAITING_SUPPORT_MESSAGE' });
    const result = await handler.handle(current, 'Preciso de ajuda', toolContext);
    expect(result.next.mode).toBe('BOT');
    expect(result.next.step).toBe('WAITING_SUPPORT_MESSAGE');
  });

  it('stays silent while a human owns the conversation', async () => {
    const result = await handler.handle(state({ mode: 'HUMAN', step: 'HUMAN' }), 'Olá?', toolContext);
    expect(result).toMatchObject({ route: 'human_silent', content: null });
    expect(notify.execute).not.toHaveBeenCalled();
  });
});

import { CancelOrderTool, RequestCancelCodeTool, SearchOrderByLocatorTool } from '../../tools/megaue/cancel.tools';
import { ToolExecutionError } from '../../tools/tools.types';
import { ConversationState } from '../flow.types';
import { CancelFlowHandler } from './cancel-flow.handler';

const baseState = (overrides: Partial<ConversationState> = {}): ConversationState => ({
  conversationId: '11111111-1111-4111-8111-111111111111',
  mode: 'BOT',
  activeFlow: 'CANCEL',
  step: 'WAITING_CANCEL_LOCATOR',
  context: {},
  version: 0,
  updatedAt: new Date(),
  ...overrides,
});
const toolContext = { correlationId: 'corr-1' };

describe('CancelFlowHandler', () => {
  const search = { execute: jest.fn() };
  const requestCode = { execute: jest.fn() };
  const cancel = { execute: jest.fn() };
  const handler = new CancelFlowHandler(
    search as unknown as SearchOrderByLocatorTool,
    requestCode as unknown as RequestCancelCodeTool,
    cancel as unknown as CancelOrderTool,
  );

  beforeEach(() => jest.clearAllMocks());

  it('starts by requesting the locator', () => {
    expect(handler.start()).toMatchObject({
      route: 'cancel',
      next: { activeFlow: 'CANCEL', step: 'WAITING_CANCEL_LOCATOR' },
    });
  });

  it('advances only a confirmed order and warns about total cancellation', async () => {
    search.execute.mockResolvedValue({
      data: {
        orderId: 10,
        value: '240,00',
        eventName: 'Show',
        status: 'CONFIRM',
        locators: ['ABC', 'DEF'],
      },
      source: 'megaue',
    });

    const result = await handler.handle(baseState(), 'ABC', toolContext);

    expect(result.next.step).toBe('WAITING_CANCEL_CONFIRMATION');
    expect(result.next.context.orderId).toBe(10);
    expect(result.content).toContain('todos os ingressos');
  });

  it('offers human support when the order is not confirmed', async () => {
    search.execute.mockResolvedValue({
      data: { orderId: 10, value: '20,00', eventName: 'Show', status: 'CANCEL', locators: ['ABC'] },
    });

    const result = await handler.handle(baseState(), 'ABC', toolContext);

    expect(result.next).toMatchObject({ activeFlow: 'SUPPORT', step: 'OFFERING_HUMAN_SUPPORT' });
  });

  it('requests a code and preserves the order context', async () => {
    requestCode.execute.mockResolvedValue({
      data: { message: 'Código enviado', maskedEmail: 'jo***@mail.com' },
    });
    const state = baseState({
      step: 'WAITING_CANCEL_CONFIRMATION',
      context: { orderId: 10, eventName: 'Show' },
    });

    const result = await handler.handle(state, 'sim', toolContext);

    expect(requestCode.execute).toHaveBeenCalledWith({ orderId: 10 }, toolContext);
    expect(result.next.step).toBe('WAITING_CANCEL_CODE');
    expect(result.content).toContain('jo***@mail.com');
  });

  it('returns to the locator when cancellation context was lost', async () => {
    const result = await handler.handle(baseState({
      step: 'WAITING_CANCEL_CODE',
      context: {},
    }), '123456', toolContext);

    expect(cancel.execute).not.toHaveBeenCalled();
    expect(result.next.step).toBe('WAITING_CANCEL_LOCATOR');
  });

  it('keeps the code step after an invalid code without storing the code', async () => {
    cancel.execute.mockRejectedValue(new ToolExecutionError('MEGAUE_VALIDATION_ERROR', 'Código inválido', false, 422));
    const state = baseState({ step: 'WAITING_CANCEL_CODE', context: { orderId: 10 } });

    const result = await handler.handle(state, 'secret-code', toolContext);

    expect(result.next.step).toBe('WAITING_CANCEL_CODE');
    expect(result.next.context).toEqual({ orderId: 10, cancelCodeAttempts: 1 });
    expect(JSON.stringify(result.next.context)).not.toContain('secret-code');
  });

  it('clears the flow after successful cancellation', async () => {
    cancel.execute.mockResolvedValue({ data: undefined, source: 'megaue' });
    const state = baseState({ step: 'WAITING_CANCEL_CODE', context: { orderId: 10 } });

    const result = await handler.handle(state, '123456', toolContext);

    expect(result.next).toEqual({ mode: 'BOT', activeFlow: null, step: 'IDLE', context: {} });
  });
});

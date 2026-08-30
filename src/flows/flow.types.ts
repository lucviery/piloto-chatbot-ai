export const conversationModes = ['BOT', 'HUMAN'] as const;
export type ConversationMode = (typeof conversationModes)[number];

export const flowNames = ['CANCEL', 'SUPPORT'] as const;
export type FlowName = (typeof flowNames)[number];

export const conversationSteps = [
  'IDLE',
  'WAITING_CANCEL_LOCATOR',
  'WAITING_CANCEL_CONFIRMATION',
  'WAITING_CANCEL_CODE',
  'OFFERING_HUMAN_SUPPORT',
  'WAITING_SUPPORT_LOCATOR',
  'WAITING_SUPPORT_MESSAGE',
  'HUMAN',
] as const;
export type ConversationStep = (typeof conversationSteps)[number];

export interface FlowContext {
  locator?: string;
  orderId?: number;
  value?: string;
  eventName?: string;
  orderStatus?: string;
  locators?: string[];
  supportMessage?: string;
  cancelCodeAttempts?: number;
}

export interface ConversationState {
  conversationId: string;
  mode: ConversationMode;
  activeFlow: FlowName | null;
  step: ConversationStep;
  context: FlowContext;
  version: number;
  updatedAt: Date;
}

export interface ConversationStateTransition {
  mode: ConversationMode;
  activeFlow: FlowName | null;
  step: ConversationStep;
  context: FlowContext;
}

export const initialConversationState = (): ConversationStateTransition => ({
  mode: 'BOT',
  activeFlow: null,
  step: 'IDLE',
  context: {},
});

export interface FlowResponse {
  content: string | null;
  next: ConversationStateTransition;
  route: 'cancel' | 'support' | 'human_handoff' | 'human_silent';
}

import { Module } from '@nestjs/common';
import { CancelOrderTool, RequestCancelCodeTool, SearchOrderByLocatorTool } from './megaue/cancel.tools';
import { MegaueChatbotClient } from './megaue/megaue-chatbot.client';
import { NotifyHumanSupportTool } from './support/notify-human-support.tool';

const tools = [SearchOrderByLocatorTool, RequestCancelCodeTool, CancelOrderTool, NotifyHumanSupportTool];

@Module({
  providers: [MegaueChatbotClient, ...tools],
  exports: tools,
})
export class ToolsModule {}

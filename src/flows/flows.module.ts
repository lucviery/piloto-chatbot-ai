import { Module } from '@nestjs/common';
import { ToolsModule } from '../tools/tools.module';
import { CancelFlowHandler } from './cancel/cancel-flow.handler';
import { CancelFlowService } from './cancel/cancel-flow.service';
import { SupportFlowHandler } from './support/support-flow.handler';
import { SupportFlowService } from './support/support-flow.service';
import { FlowRouterService } from './flow-router.service';
import { IntentClassifierService } from './intent-classifier.service';
import { HumanAttendanceController } from './human-attendance.controller';
import { HumanAttendanceService } from './human-attendance.service';

@Module({
  imports: [ToolsModule],
  controllers: [HumanAttendanceController],
  providers: [
    IntentClassifierService,
    FlowRouterService,
    CancelFlowHandler,
    CancelFlowService,
    SupportFlowHandler,
    SupportFlowService,
    HumanAttendanceService,
  ],
  exports: [FlowRouterService],
})
export class FlowsModule {}

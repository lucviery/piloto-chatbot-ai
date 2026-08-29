import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { RagModule } from '../rag/rag.module';
import { ToolsModule } from '../tools/tools.module';
import { OrchestratorController } from './orchestrator.controller';
import { OrchestratorService } from './orchestrator.service';

@Module({
  imports: [LlmModule, RagModule, ToolsModule],
  controllers: [OrchestratorController],
  providers: [OrchestratorService],
})
export class OrchestratorModule {}

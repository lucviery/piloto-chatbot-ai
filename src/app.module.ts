import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { OrchestratorModule } from './orchestrator/orchestrator.module';

@Module({
  imports: [HealthModule, OrchestratorModule],
})
export class AppModule {}


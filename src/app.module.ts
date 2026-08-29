import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RequestContextMiddleware } from './common/request-context.middleware';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { OrchestratorModule } from './orchestrator/orchestrator.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [DatabaseModule, MetricsModule, HealthModule, OrchestratorModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RequestContextMiddleware } from './common/request-context.middleware';
import { HealthModule } from './health/health.module';
import { OrchestratorModule } from './orchestrator/orchestrator.module';

@Module({
  imports: [HealthModule, OrchestratorModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}

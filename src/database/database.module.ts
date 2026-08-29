import { Global, Module } from '@nestjs/common';
import { ConversationRepository } from './conversation.repository';
import { DatabaseService } from './database.service';
import { MigrationService } from './migration.service';

@Global()
@Module({
  providers: [DatabaseService, MigrationService, ConversationRepository],
  exports: [DatabaseService, ConversationRepository],
})
export class DatabaseModule {}


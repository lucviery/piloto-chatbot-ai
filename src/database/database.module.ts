import { Global, Module } from '@nestjs/common';
import { ConversationRepository } from './conversation.repository';
import { ConversationStateRepository } from './conversation-state.repository';
import { DatabaseService } from './database.service';
import { MigrationService } from './migration.service';

@Global()
@Module({
  providers: [DatabaseService, MigrationService, ConversationRepository, ConversationStateRepository],
  exports: [DatabaseService, ConversationRepository, ConversationStateRepository],
})
export class DatabaseModule {}

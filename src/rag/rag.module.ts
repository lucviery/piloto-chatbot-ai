import { Module } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { RagService } from './rag.service';

@Module({ providers: [EmbeddingService, RagService], exports: [RagService] })
export class RagModule {}

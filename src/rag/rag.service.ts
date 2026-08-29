import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { EmbeddingService } from './embedding.service';
import { RagResult, RagSource } from './rag.types';

interface ChunkRow {
  content: string;
  title: string;
  canonical_url: string;
  similarity: number;
}

@Injectable()
export class RagService {
  constructor(
    private readonly database: DatabaseService,
    private readonly embeddings: EmbeddingService,
  ) {}

  async retrieve(query: string): Promise<RagResult> {
    const [embedding] = await this.embeddings.embed([query]);
    const vector = `[${embedding.join(',')}]`;
    const result = await this.database.query<ChunkRow>(
      `SELECT c.content, d.title, d.canonical_url,
              1 - (c.embedding <=> $1::vector) AS similarity
       FROM rag_chunks c
       JOIN rag_documents d ON d.id = c.document_id
       WHERE d.active
       ORDER BY c.embedding <=> $1::vector
       LIMIT 3`,
      [vector],
    );
    const relevant = result.rows.filter((row) => Number(row.similarity) >= 0.45);
    const sources = new Map<string, RagSource>();
    for (const row of relevant) sources.set(row.canonical_url, { title: row.title, url: row.canonical_url });
    return {
      context: relevant
        .map((row, index) => `[${index + 1}] ${row.title}\n${row.content.slice(0, 800)}`)
        .join('\n\n'),
      sources: [...sources.values()],
    };
  }
}

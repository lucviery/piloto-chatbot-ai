import { DatabaseService } from '../database/database.service';
import { EmbeddingService } from './embedding.service';
import { RagService } from './rag.service';

const cases = [
  { question: 'Como criar uma cortesia?', expectedPath: '/criar_cortesia' },
  { question: 'Como criar um evento?', expectedPath: '/criar_evento' },
  { question: 'Como cancelar uma compra feita na máquina?', expectedPath: '/cancelar_compra_maquina' },
  { question: 'Como criar um usuário promotor?', expectedPath: '/criar_usuario_promotor' },
  { question: 'Como reimprimir uma compra na máquina?', expectedPath: '/reimprimir_compra_maquina' },
];

async function main(): Promise<void> {
  const database = new DatabaseService();
  const rag = new RagService(database, new EmbeddingService());
  let hits = 0;
  try {
    for (const item of cases) {
      const result = await rag.retrieve(item.question);
      const hit = result.sources.some((source) => new URL(source.url).pathname === item.expectedPath);
      if (hit) hits += 1;
      process.stdout.write(`${JSON.stringify({ question: item.question, hit, sources: result.sources.map((source) => source.url) })}\n`);
    }
    const score = hits / cases.length;
    process.stdout.write(`${JSON.stringify({ event: 'rag_evaluation_completed', hits, total: cases.length, score })}\n`);
    if (score < 0.8) process.exitCode = 1;
  } finally {
    await database.onModuleDestroy();
  }
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Falha na avaliação.'}\n`);
  process.exitCode = 1;
});


import { load } from 'cheerio';
import { createHash, randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import { EmbeddingService } from './embedding.service';

const baseUrl = process.env.RAG_BASE_URL ?? 'https://dokuwiki.megaue.com.br';

function chunks(text: string, size = 1200, overlap = 200): string[] {
  const paragraphs = text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  const result: string[] = [];
  let current = '';
  for (const paragraph of paragraphs) {
    if (current && current.length + paragraph.length > size) {
      result.push(current);
      current = `${current.slice(-overlap)}\n\n${paragraph}`;
    } else current = current ? `${current}\n\n${paragraph}` : paragraph;
  }
  if (current) result.push(current);
  return result;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Falha ${response.status} em ${url}`);
  return response.text();
}

async function main(): Promise<void> {
  const database = new DatabaseService();
  const embeddingService = new EmbeddingService();
  if (!database.configured) throw new Error('Banco de dados não configurado.');

  try {
    const indexHtml = await fetchText(`${baseUrl}/doku.php?id=start&do=index`);
    const $index = load(indexHtml);
    const ids = new Set<string>(['start']);
    $index('a[href]').each((_, element) => {
      const href = $index(element).attr('href');
      if (!href || !href.startsWith('/') || href.includes('?') || href.startsWith('/lib/')) return;
      const id = decodeURIComponent(href.slice(1)).replaceAll('/', ':');
      if (id && !id.startsWith('_')) ids.add(id);
    });

    let documents = 0;
    let chunkCount = 0;
    for (const id of [...ids].sort()) {
      const canonicalUrl = `${baseUrl}/${id.replaceAll(':', '/')}`;
      const html = await fetchText(`${baseUrl}/_export/xhtml/${encodeURIComponent(id)}`);
      const $ = load(html);
      $('script, style, nav, form').remove();
      const title = $('h1').first().text().trim() || id;
      const text = $.root().text().replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
      if (text.length < 40) continue;
      const hash = createHash('sha256').update(text).digest('hex');
      const documentId = randomUUID();
      const parts = chunks(text);
      const vectors = await embeddingService.embed(parts.map((part) => `title: ${title}\n${part}`));

      await database.transaction(async (client) => {
        await client.query('UPDATE rag_documents SET active = false WHERE canonical_url = $1 AND content_hash <> $2', [canonicalUrl, hash]);
        const document = await client.query<{ id: string }>(
          `INSERT INTO rag_documents(id, canonical_url, title, content_hash)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (canonical_url, content_hash)
           DO UPDATE SET title = EXCLUDED.title, collected_at = now(), active = true
           RETURNING id`,
          [documentId, canonicalUrl, title, hash],
        );
        const persistedId = document.rows[0].id;
        await client.query('DELETE FROM rag_chunks WHERE document_id = $1', [persistedId]);
        for (let index = 0; index < parts.length; index += 1) {
          await client.query(
            `INSERT INTO rag_chunks(id, document_id, chunk_index, content, embedding)
             VALUES ($1, $2, $3, $4, $5::vector)`,
            [randomUUID(), persistedId, index, parts[index], `[${vectors[index].join(',')}]`],
          );
        }
      });
      documents += 1;
      chunkCount += parts.length;
      process.stdout.write(`${JSON.stringify({ event: 'rag_document_ingested', id, chunks: parts.length })}\n`);
    }
    process.stdout.write(`${JSON.stringify({ event: 'rag_ingestion_completed', documents, chunks: chunkCount })}\n`);
  } finally {
    await database.onModuleDestroy();
  }
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Falha na ingestão.'}\n`);
  process.exitCode = 1;
});

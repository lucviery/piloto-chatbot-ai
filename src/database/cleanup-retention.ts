import { DatabaseService } from './database.service';

async function main(): Promise<void> {
  const retentionDays = Number(process.env.RETENTION_DAYS ?? 30);
  if (!Number.isInteger(retentionDays) || retentionDays < 1) {
    throw new Error('RETENTION_DAYS deve ser um inteiro positivo.');
  }

  const database = new DatabaseService();
  if (!database.configured) throw new Error('Banco de dados não configurado.');

  try {
    const conversations = await database.query(
      `DELETE FROM conversations
       WHERE last_message_at < now() - make_interval(days => $1::int)`,
      [retentionDays],
    );
    const sessions = await database.query(
      `DELETE FROM chat_sessions s
       WHERE s.last_seen_at < now() - make_interval(days => $1::int)
         AND NOT EXISTS (SELECT 1 FROM conversations c WHERE c.session_id = s.id)`,
      [retentionDays],
    );
    process.stdout.write(
      `${JSON.stringify({
        event: 'retention_cleanup_completed',
        retentionDays,
        conversationsDeleted: conversations.rowCount ?? 0,
        sessionsDeleted: sessions.rowCount ?? 0,
      })}\n`,
    );
  } finally {
    await database.onModuleDestroy();
  }
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Falha na limpeza de retenção.'}\n`);
  process.exitCode = 1;
});


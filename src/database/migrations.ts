export interface Migration {
  version: string;
  sql: string;
}

export const migrations: Migration[] = [
  {
    version: '001_initial_chat_schema',
    sql: `
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id uuid PRIMARY KEY,
        created_at timestamptz NOT NULL DEFAULT now(),
        last_seen_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id uuid PRIMARY KEY,
        session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        last_message_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS conversations_session_id_idx
        ON conversations(session_id);

      CREATE TABLE IF NOT EXISTS messages (
        id uuid PRIMARY KEY,
        conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role text NOT NULL CHECK (role IN ('user', 'assistant')),
        content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 40000),
        model text,
        correlation_id varchar(128) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS messages_conversation_created_idx
        ON messages(conversation_id, created_at);
      CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);
    `,
  },
];


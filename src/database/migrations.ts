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
  {
    version: '002_rag_documents_and_vectors',
    sql: `
      CREATE EXTENSION IF NOT EXISTS vector;

      CREATE TABLE IF NOT EXISTS rag_documents (
        id uuid PRIMARY KEY,
        canonical_url text NOT NULL,
        title text NOT NULL,
        content_hash varchar(64) NOT NULL,
        collected_at timestamptz NOT NULL DEFAULT now(),
        active boolean NOT NULL DEFAULT true,
        UNIQUE (canonical_url, content_hash)
      );

      CREATE UNIQUE INDEX IF NOT EXISTS rag_one_active_version_per_url
        ON rag_documents(canonical_url) WHERE active;

      CREATE TABLE IF NOT EXISTS rag_chunks (
        id uuid PRIMARY KEY,
        document_id uuid NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
        chunk_index integer NOT NULL CHECK (chunk_index >= 0),
        content text NOT NULL,
        embedding vector(768) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (document_id, chunk_index)
      );

      CREATE INDEX IF NOT EXISTS rag_chunks_embedding_hnsw
        ON rag_chunks USING hnsw (embedding vector_cosine_ops);
    `,
  },
  {
    version: '003_conversation_flow_state',
    sql: `
      CREATE TABLE IF NOT EXISTS conversation_states (
        conversation_id uuid PRIMARY KEY REFERENCES conversations(id) ON DELETE CASCADE,
        mode text NOT NULL DEFAULT 'BOT' CHECK (mode IN ('BOT', 'HUMAN')),
        active_flow text CHECK (active_flow IN ('CANCEL', 'SUPPORT')),
        step text NOT NULL DEFAULT 'IDLE' CHECK (step IN (
          'IDLE',
          'WAITING_CANCEL_LOCATOR',
          'WAITING_CANCEL_CONFIRMATION',
          'WAITING_CANCEL_CODE',
          'OFFERING_HUMAN_SUPPORT',
          'WAITING_SUPPORT_LOCATOR',
          'WAITING_SUPPORT_MESSAGE',
          'HUMAN'
        )),
        context jsonb NOT NULL DEFAULT '{}'::jsonb,
        version integer NOT NULL DEFAULT 0 CHECK (version >= 0),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK (jsonb_typeof(context) = 'object'),
        CHECK (
          (mode = 'HUMAN' AND step = 'HUMAN' AND active_flow = 'SUPPORT')
          OR mode = 'BOT'
        ),
        CHECK (
          (step = 'IDLE' AND active_flow IS NULL)
          OR (step IN (
            'WAITING_CANCEL_LOCATOR',
            'WAITING_CANCEL_CONFIRMATION',
            'WAITING_CANCEL_CODE'
          ) AND active_flow = 'CANCEL')
          OR (step IN (
            'OFFERING_HUMAN_SUPPORT',
            'WAITING_SUPPORT_LOCATOR',
            'WAITING_SUPPORT_MESSAGE',
            'HUMAN'
          ) AND active_flow = 'SUPPORT')
        )
      );

      CREATE INDEX IF NOT EXISTS conversation_states_mode_updated_idx
        ON conversation_states(mode, updated_at);
    `,
  },
];

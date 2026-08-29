import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { migrations } from './migrations';

@Injectable()
export class MigrationService implements OnModuleInit {
  private readonly logger = new Logger(MigrationService.name);

  constructor(private readonly database: DatabaseService) {}

  async onModuleInit(): Promise<void> {
    if (!this.database.configured) return;

    await this.database.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version varchar(100) PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    for (const migration of migrations) {
      const applied = await this.database.query(
        'SELECT 1 FROM schema_migrations WHERE version = $1',
        [migration.version],
      );
      if (applied.rowCount) continue;

      await this.database.transaction(async (client) => {
        await client.query(migration.sql);
        await client.query('INSERT INTO schema_migrations(version) VALUES ($1)', [migration.version]);
      });
      this.logger.log(JSON.stringify({ event: 'migration_applied', version: migration.version }));
    }
  }
}


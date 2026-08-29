import { MigrationService } from './migration.service';
import { DatabaseService } from './database.service';

describe('MigrationService', () => {
  it('applies a pending migration in a transaction', async () => {
    const client = { query: jest.fn().mockResolvedValue({}) };
    const database = {
      configured: true,
      query: jest.fn()
        .mockResolvedValueOnce({ rowCount: 0 })
        .mockResolvedValueOnce({ rowCount: 0 }),
      transaction: jest.fn(async (operation) => operation(client)),
    } as unknown as DatabaseService;

    await new MigrationService(database).onModuleInit();

    expect(client.query).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS chat_sessions'));
    expect(client.query).toHaveBeenCalledWith(
      'INSERT INTO schema_migrations(version) VALUES ($1)',
      ['001_initial_chat_schema'],
    );
  });

  it('does not reapply an existing migration', async () => {
    const database = {
      configured: true,
      query: jest.fn()
        .mockResolvedValueOnce({ rowCount: 0 })
        .mockResolvedValueOnce({ rowCount: 1 }),
      transaction: jest.fn(),
    } as unknown as DatabaseService;

    await new MigrationService(database).onModuleInit();

    expect(database.transaction).not.toHaveBeenCalled();
  });
});


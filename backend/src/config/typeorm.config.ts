import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfig = (): TypeOrmModuleOptions => {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  const host = process.env.DB_HOST ?? process.env.PGHOST;
  const port = Number(process.env.DB_PORT ?? process.env.PGPORT ?? 5432);
  const username = process.env.DB_USER ?? process.env.PGUSER;
  const password = process.env.DB_PASSWORD ?? process.env.PGPASSWORD;
  const database = process.env.DB_NAME ?? process.env.PGDATABASE;

  const hasDatabaseUrl = Boolean(databaseUrl);
  const hasDiscreteDbConfig = Boolean(host && username && password && database);

  if (process.env.NODE_ENV === 'production' && !hasDatabaseUrl && !hasDiscreteDbConfig) {
    throw new Error(
      'Missing database configuration in production. Set DATABASE_URL (recommended) or DB_*/PG* variables.',
    );
  }

  const forceSslFromEnv = process.env.DB_SSL === 'true';
  const useSsl = forceSslFromEnv || (process.env.NODE_ENV === 'production' && hasDatabaseUrl);
  const syncRequested = process.env.DB_SYNC === 'true';

  return {
    type: 'postgres',
    url: databaseUrl,
    host,
    port,
    username,
    password,
    database,
    synchronize: process.env.NODE_ENV !== 'production' || syncRequested,
    autoLoadEntities: true,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  };
};

import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfig = (): TypeOrmModuleOptions => {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  const forceSslFromEnv = process.env.DB_SSL === 'true';
  const useSsl = forceSslFromEnv || (process.env.NODE_ENV === 'production' && hasDatabaseUrl);

  return {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: process.env.NODE_ENV !== 'production',
    autoLoadEntities: true,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  };
};

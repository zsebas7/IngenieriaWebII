import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Expense } from '../modules/expenses/entities/expense.entity';
import { Category } from '../modules/categories/entities/category.entity';

// Parse DATABASE_URL if provided (Railway format: postgresql://user:password@host:port/database)
const parseDatabaseUrl = (): any => {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    const url = new URL(databaseUrl);
    return {
      type: 'postgres' as const,
      host: url.hostname,
      port: parseInt(url.port || '5432'),
      username: url.username,
      password: url.password,
      database: url.pathname.slice(1), // Remove leading '/'
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };
  }
  return null;
};

const dbConfig = parseDatabaseUrl() || {
  type: 'postgres' as const,
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'neto_db',
};

export const databaseConfig: TypeOrmModuleOptions = {
  ...dbConfig,
  entities: [User, Expense, Category],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  dropSchema: false,
  extra: {
    max: 20, // Connection pool size
  },
};

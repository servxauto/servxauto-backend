/**
 * TypeORM CLI Data Source Configuration
 *
 * Provides a standalone database connection for TypeORM CLI operations
 * (such as generating, running, and reverting database migrations)
 * outside of the NestJS runtime environment.
 */

import { join } from 'path';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'servxauto',
  entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
  migrations: [
    join(__dirname, 'migrations', '*{.ts,.js}'),
    join(__dirname, 'seeders', '*{.ts,.js}'),
  ],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});

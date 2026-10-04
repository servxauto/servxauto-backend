import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import { join } from 'path';

export const typeOrmAsyncConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: config.get('DB_HOST'),
    port: parseInt(config.get('DB_PORT', '5432'), 10),
    username: config.get('DB_USERNAME'),
    password: config.get('DB_PASSWORD'),
    database: config.get('DB_NAME'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [
      join(__dirname, 'migrations', '*{.ts,.js}'),
      join(__dirname, 'seeders', '*{.ts,.js}'),
    ],
    synchronize: false,
    logging: config.get('NODE_ENV') === 'development',
  }),
};

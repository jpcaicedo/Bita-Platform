import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AuthorizationsModule } from './authorizations/authorizations.module';
import { MaintenanceRecordsModule } from './maintenance-records/maintenance-records.module';
import { MaintenanceTypesModule } from './maintenance-types/maintenance-types.module';
import { RemindersModule } from './reminders/reminders.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { WorkshopsModule } from './workshops/workshops.module';

const toBoolean = (
  value: string | undefined,
  fallback: boolean,
): boolean => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: false,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
        const isProduction = nodeEnv === 'production';
        // Neon (and most managed Postgres providers) hand out a single URL.
        const url = configService.get<string>('DATABASE_URL');

        // SSL is mandatory on Neon. It is disabled by default locally.
        const useSsl = toBoolean(
          configService.get<string>('DB_SSL'),
          isProduction || Boolean(url),
        );
        const rejectUnauthorized = toBoolean(
          configService.get<string>('DB_SSL_REJECT_UNAUTHORIZED'),
          true,
        );

        // There are no migrations yet, so the schema is created by TypeORM.
        // Set DB_SYNC=false once migrations are in place.
        const synchronize = toBoolean(
          configService.get<string>('DB_SYNC'),
          !isProduction,
        );

        const shared: TypeOrmModuleOptions = {
          type: 'postgres',
          autoLoadEntities: true,
          synchronize,
          ssl: useSsl ? { rejectUnauthorized } : false,
          retryAttempts: 10,
          retryDelay: 3000,
        };

        if (url) {
          return { ...shared, url };
        }

        return {
          ...shared,
          host: configService.get<string>('DB_HOST') ?? 'localhost',
          port: Number(configService.get<string>('DB_PORT') ?? 5433),
          username: configService.get<string>('DB_USERNAME') ?? 'postgres',
          password: configService.get<string>('DB_PASSWORD') ?? 'postgres',
          database: configService.get<string>('DB_DATABASE') ?? 'bita_db',
        };
      },
    }),
    AuthModule,
    WorkshopsModule,
    VehiclesModule,
    MaintenanceTypesModule,
    MaintenanceRecordsModule,
    AuthorizationsModule,
    RemindersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

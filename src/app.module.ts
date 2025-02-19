import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { TaskService } from './service/task.service';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisService } from './service/redis.service';
import { ScanService } from './service/scan.service';
import { AppController } from './app.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { PfTrade } from './entities/PfTrade';
import { PfCreate } from './entities/PfCreate';
import { BullQueueName } from './config/constants';
import { SolanaSlot } from './entities/SolanaSlot';
import { WorkerService } from './service/worker.service';
import { BullModule } from '@nestjs/bullmq';
import { HttpModule } from '@nestjs/axios';
import { UserTrade } from './entities/UserTrade';
import { UserToken } from './entities/UserToken';
import { PfTxId } from './entities/PfTxId';
import { PfTxConf } from './entities/PfTxConf';
import { Config } from './entities/Config';
import { AxiosService } from './service/axios.service';
import { DynamicConfigService } from './service/dynamic.config.service';
import { UserClip } from './entities/UserClip';
const env = process.env.NODE_ENV || 'development'; // 默认加载 development 环境

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({
      envFilePath: ['.env', `.env.${env}`],
    }),
    TypeOrmModule.forFeature([PfTrade, PfCreate, SolanaSlot, UserTrade, UserToken, PfTxId, PfTxConf, Config, UserClip]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('POSTGRES_DB_HOST'),
        port: configService.get('POSTGRES_DB_PORT'),
        username: configService.get('POSTGRES_DB_USERNAME'),
        password: configService.get('POSTGRES_DB_PASSWORD'),
        database: configService.get('POSTGRES_DB_DATABASE'),
        synchronize: false,
        //entities: [PfTrade, PfCreate, SolanaSlot],
        autoLoadEntities: true
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection:{
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB'),
        }
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      prefix: BullQueueName.PREFIX,
      name: BullQueueName.SLOT_QUEUE,
    }),
    ScheduleModule.forRoot()],
  providers: [AppService, RedisService, TaskService, ScanService, WorkerService, AxiosService, DynamicConfigService],
  controllers: [AppController],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}

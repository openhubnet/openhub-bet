import { Injectable, Logger,OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry, Timeout } from '@nestjs/schedule';
import { RedisService } from './redis.service';
import { CronJob } from 'cron';
import { Callback } from 'ioredis/built/types';
import { ScanService } from './scan.service';

@Injectable()
export class TaskService implements OnModuleInit{
  private readonly logger = new Logger(TaskService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly scanService: ScanService
  ) {}

  onModuleInit() {
    this.logger.log("TaskService OnModuleInit");
  }

  // 动态创建cron任务
  addCronJob(jobName:string,cronTime:string, callback: Callback<unknown>) {
    this.logger.log(`${jobName}:(${cronTime}) scheduler registry`);
    const job = new CronJob(cronTime, callback);
    this.schedulerRegistry.addCronJob(jobName, job);
    job.start();
  }

  //@Timeout(1000)
  refreshBlockNumber() {
   //this.addCronJob("REFRESH_BLOCK_JOB","*!/30 * * * * *", ()=>this.scanService.refreshBlockNumber())
  }

  //@Timeout(1000)
  sendTask() {
    //this.addCronJob("REFRESH_TASK_JOB","*!/5 * * * * *", ()=>this.scanService.sendTask())
  }

  @Timeout(1000)
  listenerLog() {
    this.scanService.listenerLog()
  }

  @Timeout(1000)
  initMergeTrade() {
    this.scanService.initMergeTrade()
  }

  @Timeout(1000)
  initMergePfHashTask(){
    this.scanService.initMergePfHashTask()
  }
}


import { BullQueueName, BullTaskName } from '../config/constants';
import { Job } from 'bullmq';
import { Logger, OnModuleInit } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost} from '@nestjs/bullmq';
import { ScanService } from './scan.service';
import * as os from 'os';
import { PfHashTaskData } from '../dto/common.dto';
const cpuCount = os.cpus().length;

//@Processor(BullQueueName.SLOT_QUEUE, {concurrency: cpuCount})
export class WorkerService extends WorkerHost implements OnModuleInit{

  private readonly logger = new Logger(WorkerService.name);

  constructor(
    private readonly scanService: ScanService
  ){
    super();
  }
  async process(job: Job, token: string | undefined): Promise<any> {
      if (job.name === BullTaskName.SLOT_TASK) {
        await this.scanService.parseBlock(job.data)
      }else if(job.name === BullTaskName.LOG_SUBSCRIBE_TASK){
        await this.scanService.saveDataBucketWithDistributedLock(job.data, job.id)
      }/*else if(job.name === BullTaskName.PF_HASH_TASK){
        await this.scanService.recursionDealPfHashTask(job.data)
      }*/
      return Promise.resolve(job.id);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
   //this.logger.log(`Processing job ${job.id} of type ${job.name}`,);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: any, prev: string) {
   // this.logger.log(`Completed job ${job.id}, result: ${JSON.stringify(result, null, 2)}`,);
  }

  //当队列已清空等待列表时，会触发此事件。请注意，仍可能有延迟的作业等待其计时器到期，只要等待列表已清空，此事件仍将被触发。
  @OnWorkerEvent('drained')
  onDrained() {
    //this.logger.log(`Worker drained`);
  }

  @OnWorkerEvent('closed')
  onClosed() {
    this.logger.log(`Worker closed`);
  }

  @OnWorkerEvent('closing')
  onClosing() {
    this.logger.log(`Worker closing`);
  }

  @OnWorkerEvent('ready')
  onReady() {
    this.logger.log(`Worker ready`);
  }

  @OnWorkerEvent('resumed')
  onResumed() {
    this.logger.log(`Worker resumed`);
  }

  @OnWorkerEvent('error')
  onError(failedReason: Error) {
    this.logger.error(`Worker error`, failedReason);
  }

  @OnWorkerEvent('ioredis:close')
  onRedisClosed() {
    this.logger.log(`Worker ioredis:close`,);
  }

  @OnWorkerEvent('progress')
  onProgress(job:Job, progress:any) {
    this.logger.error(`Worker progress ${job.id}`);
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId:string, prev:string) {
    this.logger.error(`Worker stalled jobId:${jobId}, prev:${prev}`);
  }

  async onModuleInit() {
    //
  }
}

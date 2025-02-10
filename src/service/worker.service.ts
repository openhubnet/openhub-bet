
import { BullQueueName, BullTaskName } from '../config/constants';
import { Job } from 'bullmq';
import { Logger, OnModuleInit } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost} from '@nestjs/bullmq';
import { ScanService } from './scan.service';
import * as os from 'os';
const cpuCount = os.cpus().length;

@Processor(BullQueueName.SLOT_QUEUE, {concurrency: cpuCount})
export class WorkerService extends WorkerHost implements OnModuleInit{

  private readonly logger = new Logger(WorkerService.name);

  constructor(
    private readonly scanService: ScanService
  ){
    super();
  }
  async process(job: Job, token: string | undefined): Promise<any> {
      if (job.name === BullTaskName.SLOT_TASK) {
/*        await Utils.sleep(5000).then(()=>{
          //console.log(`${job.id} done`)
        });*/
        await this.scanService.parseBlock(job.data)
      }
      return Promise.resolve(job.id);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
   // this.logger.log(`Processing job ${job.id} of type ${job.name} with data ${job.data}`,);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: any, prev: string) {
   // this.logger.log(`Completed job ${job.id}, result: ${JSON.stringify(result, null, 2)}`,);
  }

  @OnWorkerEvent('drained')
  onDrained() {
    this.logger.log(`Worker drained`);
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

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

  @Timeout(1000)
  refreshBlockNumber() {
   //this.addCronJob("REFRESH_BLOCK_JOB","*/30 * * * * *", ()=>this.scanService.refreshBlockNumber())
  }

  @Timeout(1000)
  sendTask() {
    //this.addCronJob("REFRESH_TASK_JOB","*/5 * * * * *", ()=>this.scanService.sendTask())
  }

  @Timeout(1000)
  listenerLog() {
    //this.scanService.listenerLog()
  }

  @Timeout(1000)
  mergeTrade() {
    //this.addCronJob("MERGE_TRADE_JOB","*/5 * * * * *", ()=>this.scanService.mergeTrade())
  }

  @Timeout(1000)
  mergeTradeClip() {
    //this.addCronJob("MERGE_TRADE_CLIP_JOB","*/15 * * * * *", ()=>this.scanService.mergeTradeClip())
  }

  @Timeout(1000)
  mergeToken() {
    //this.addCronJob("MERGE_TOKEN_JOB","*/10 * * * * *", ()=>this.scanService.mergeToken())
  }

  @Timeout(1000)
  mergePfHashV2() {
    const hashes = [
      "2YvoZq3JtCexZ5xZCVLUVRedKWXYn1h3QwD6TE9rgDubApPB5KBcg9tvG7GXUa3Vui8txuL9P43Cxxbg4Tvp8s92",
      "23m6BmXvBqCJkJVGWGqGqB7p9Z7bwVcoTVh6CakGDbRoPQfGFpi2v1DfSQptpc9rNM3ZGV2JgGfjRwKGvq4Jqa7Y",
      "5MPEBtUZVcGZJ9sTQvsNEeN31ZQX56Z2N53mN6vpZbzR6aZfVFQnWTwkuNwdDmnF68sps9Jv7WyVHckr1qrCGC4a",
      "5Go9fhn8g9seJSwoC3yMsbGbW3xTwPpbk9Y79d5tXRv8y4mZAUCX9aRpbc7KP4YGkPE3smUNeD3S3wUoyLbLtzXQ",
      "5bCZJ3RYAxMCARtGX5J56CR8vwTp9xVUsffoLAbBrpTqiN2h9xCyeVhxSi38dMEonVcAxDTBni5c8cnWnRxhFXht",
      "4K2dNgYWGh3VFQjkPvqY4kWfi6N3mTqfBhvWjxfzPmw9UfMKypQRbRiJJRtPnKTwhdj8sVyEB9UamrNuHhxE92Lm",
      "4yphpk5D1hx7hku3d3bq39bPgSceRhWdo7C6b9CmVeAPRgEcNJAoUhX856FhzqAUS6ZrSUU6Ek6LncbmnYZH2fUd",
      "5jyP2kN49hoSB4RxLXLkLM9rfpJSEsDZsuVT3vaSqBDigWZqufMwgssHABasfxt1X8eMejmVNbihfUE5mUAzxc82",
      "3FnuCQqpvg4n4FSGw1NRVf9Hzj3ZXGcEHA5PvNdriGxjqwjv7jbQdkQtAaHCbgsWyYeNLXizTpNVGmao11ZAppoW",
      "pJSRTEDLsCtprNFNd5DkNAuJdjriWLoLEZE5PoQtB7jGms2f7CFAmfUNk1RVZmjFkYhqx8ogqodYqSPEsmJDSTp",

      "2YvoZq3JtCexZ5xZCVLUVRedKWXYn1h3QwD6TE9rgDubApPB5KBcg9tvG7GXUa3Vui8txuL9P43Cxxbg4Tvp8s92",
      "23m6BmXvBqCJkJVGWGqGqB7p9Z7bwVcoTVh6CakGDbRoPQfGFpi2v1DfSQptpc9rNM3ZGV2JgGfjRwKGvq4Jqa7Y",
      "5MPEBtUZVcGZJ9sTQvsNEeN31ZQX56Z2N53mN6vpZbzR6aZfVFQnWTwkuNwdDmnF68sps9Jv7WyVHckr1qrCGC4a",
      "5Go9fhn8g9seJSwoC3yMsbGbW3xTwPpbk9Y79d5tXRv8y4mZAUCX9aRpbc7KP4YGkPE3smUNeD3S3wUoyLbLtzXQ",
      "5bCZJ3RYAxMCARtGX5J56CR8vwTp9xVUsffoLAbBrpTqiN2h9xCyeVhxSi38dMEonVcAxDTBni5c8cnWnRxhFXht",
      "4K2dNgYWGh3VFQjkPvqY4kWfi6N3mTqfBhvWjxfzPmw9UfMKypQRbRiJJRtPnKTwhdj8sVyEB9UamrNuHhxE92Lm",
      "4yphpk5D1hx7hku3d3bq39bPgSceRhWdo7C6b9CmVeAPRgEcNJAoUhX856FhzqAUS6ZrSUU6Ek6LncbmnYZH2fUd",
      "5jyP2kN49hoSB4RxLXLkLM9rfpJSEsDZsuVT3vaSqBDigWZqufMwgssHABasfxt1X8eMejmVNbihfUE5mUAzxc82",
      "3FnuCQqpvg4n4FSGw1NRVf9Hzj3ZXGcEHA5PvNdriGxjqwjv7jbQdkQtAaHCbgsWyYeNLXizTpNVGmao11ZAppoW",
      "pJSRTEDLsCtprNFNd5DkNAuJdjriWLoLEZE5PoQtB7jGms2f7CFAmfUNk1RVZmjFkYhqx8ogqodYqSPEsmJDSTp",

      "2YvoZq3JtCexZ5xZCVLUVRedKWXYn1h3QwD6TE9rgDubApPB5KBcg9tvG7GXUa3Vui8txuL9P43Cxxbg4Tvp8s92",
      "23m6BmXvBqCJkJVGWGqGqB7p9Z7bwVcoTVh6CakGDbRoPQfGFpi2v1DfSQptpc9rNM3ZGV2JgGfjRwKGvq4Jqa7Y",
      "5MPEBtUZVcGZJ9sTQvsNEeN31ZQX56Z2N53mN6vpZbzR6aZfVFQnWTwkuNwdDmnF68sps9Jv7WyVHckr1qrCGC4a",
      "5Go9fhn8g9seJSwoC3yMsbGbW3xTwPpbk9Y79d5tXRv8y4mZAUCX9aRpbc7KP4YGkPE3smUNeD3S3wUoyLbLtzXQ",
      "5bCZJ3RYAxMCARtGX5J56CR8vwTp9xVUsffoLAbBrpTqiN2h9xCyeVhxSi38dMEonVcAxDTBni5c8cnWnRxhFXht",
      "4K2dNgYWGh3VFQjkPvqY4kWfi6N3mTqfBhvWjxfzPmw9UfMKypQRbRiJJRtPnKTwhdj8sVyEB9UamrNuHhxE92Lm",
      "4yphpk5D1hx7hku3d3bq39bPgSceRhWdo7C6b9CmVeAPRgEcNJAoUhX856FhzqAUS6ZrSUU6Ek6LncbmnYZH2fUd",
      "5jyP2kN49hoSB4RxLXLkLM9rfpJSEsDZsuVT3vaSqBDigWZqufMwgssHABasfxt1X8eMejmVNbihfUE5mUAzxc82",
      "3FnuCQqpvg4n4FSGw1NRVf9Hzj3ZXGcEHA5PvNdriGxjqwjv7jbQdkQtAaHCbgsWyYeNLXizTpNVGmao11ZAppoW",
      "pJSRTEDLsCtprNFNd5DkNAuJdjriWLoLEZE5PoQtB7jGms2f7CFAmfUNk1RVZmjFkYhqx8ogqodYqSPEsmJDSTp",

      "2YvoZq3JtCexZ5xZCVLUVRedKWXYn1h3QwD6TE9rgDubApPB5KBcg9tvG7GXUa3Vui8txuL9P43Cxxbg4Tvp8s92",
      "23m6BmXvBqCJkJVGWGqGqB7p9Z7bwVcoTVh6CakGDbRoPQfGFpi2v1DfSQptpc9rNM3ZGV2JgGfjRwKGvq4Jqa7Y",
      "5MPEBtUZVcGZJ9sTQvsNEeN31ZQX56Z2N53mN6vpZbzR6aZfVFQnWTwkuNwdDmnF68sps9Jv7WyVHckr1qrCGC4a",
      "5Go9fhn8g9seJSwoC3yMsbGbW3xTwPpbk9Y79d5tXRv8y4mZAUCX9aRpbc7KP4YGkPE3smUNeD3S3wUoyLbLtzXQ",
      "5bCZJ3RYAxMCARtGX5J56CR8vwTp9xVUsffoLAbBrpTqiN2h9xCyeVhxSi38dMEonVcAxDTBni5c8cnWnRxhFXht",
      "4K2dNgYWGh3VFQjkPvqY4kWfi6N3mTqfBhvWjxfzPmw9UfMKypQRbRiJJRtPnKTwhdj8sVyEB9UamrNuHhxE92Lm",
      "4yphpk5D1hx7hku3d3bq39bPgSceRhWdo7C6b9CmVeAPRgEcNJAoUhX856FhzqAUS6ZrSUU6Ek6LncbmnYZH2fUd",
      "5jyP2kN49hoSB4RxLXLkLM9rfpJSEsDZsuVT3vaSqBDigWZqufMwgssHABasfxt1X8eMejmVNbihfUE5mUAzxc82",
      "3FnuCQqpvg4n4FSGw1NRVf9Hzj3ZXGcEHA5PvNdriGxjqwjv7jbQdkQtAaHCbgsWyYeNLXizTpNVGmao11ZAppoW",
      "pJSRTEDLsCtprNFNd5DkNAuJdjriWLoLEZE5PoQtB7jGms2f7CFAmfUNk1RVZmjFkYhqx8ogqodYqSPEsmJDSTp",

      "2YvoZq3JtCexZ5xZCVLUVRedKWXYn1h3QwD6TE9rgDubApPB5KBcg9tvG7GXUa3Vui8txuL9P43Cxxbg4Tvp8s92",
      "23m6BmXvBqCJkJVGWGqGqB7p9Z7bwVcoTVh6CakGDbRoPQfGFpi2v1DfSQptpc9rNM3ZGV2JgGfjRwKGvq4Jqa7Y",
      "5MPEBtUZVcGZJ9sTQvsNEeN31ZQX56Z2N53mN6vpZbzR6aZfVFQnWTwkuNwdDmnF68sps9Jv7WyVHckr1qrCGC4a",
      "5Go9fhn8g9seJSwoC3yMsbGbW3xTwPpbk9Y79d5tXRv8y4mZAUCX9aRpbc7KP4YGkPE3smUNeD3S3wUoyLbLtzXQ",
      "5bCZJ3RYAxMCARtGX5J56CR8vwTp9xVUsffoLAbBrpTqiN2h9xCyeVhxSi38dMEonVcAxDTBni5c8cnWnRxhFXht",
      "4K2dNgYWGh3VFQjkPvqY4kWfi6N3mTqfBhvWjxfzPmw9UfMKypQRbRiJJRtPnKTwhdj8sVyEB9UamrNuHhxE92Lm",
      "4yphpk5D1hx7hku3d3bq39bPgSceRhWdo7C6b9CmVeAPRgEcNJAoUhX856FhzqAUS6ZrSUU6Ek6LncbmnYZH2fUd",
      "5jyP2kN49hoSB4RxLXLkLM9rfpJSEsDZsuVT3vaSqBDigWZqufMwgssHABasfxt1X8eMejmVNbihfUE5mUAzxc82",
      "3FnuCQqpvg4n4FSGw1NRVf9Hzj3ZXGcEHA5PvNdriGxjqwjv7jbQdkQtAaHCbgsWyYeNLXizTpNVGmao11ZAppoW",
      "pJSRTEDLsCtprNFNd5DkNAuJdjriWLoLEZE5PoQtB7jGms2f7CFAmfUNk1RVZmjFkYhqx8ogqodYqSPEsmJDSTp",

      "2YvoZq3JtCexZ5xZCVLUVRedKWXYn1h3QwD6TE9rgDubApPB5KBcg9tvG7GXUa3Vui8txuL9P43Cxxbg4Tvp8s92",
      "23m6BmXvBqCJkJVGWGqGqB7p9Z7bwVcoTVh6CakGDbRoPQfGFpi2v1DfSQptpc9rNM3ZGV2JgGfjRwKGvq4Jqa7Y",
      "5MPEBtUZVcGZJ9sTQvsNEeN31ZQX56Z2N53mN6vpZbzR6aZfVFQnWTwkuNwdDmnF68sps9Jv7WyVHckr1qrCGC4a",
      "5Go9fhn8g9seJSwoC3yMsbGbW3xTwPpbk9Y79d5tXRv8y4mZAUCX9aRpbc7KP4YGkPE3smUNeD3S3wUoyLbLtzXQ",
      "5bCZJ3RYAxMCARtGX5J56CR8vwTp9xVUsffoLAbBrpTqiN2h9xCyeVhxSi38dMEonVcAxDTBni5c8cnWnRxhFXht",
      "4K2dNgYWGh3VFQjkPvqY4kWfi6N3mTqfBhvWjxfzPmw9UfMKypQRbRiJJRtPnKTwhdj8sVyEB9UamrNuHhxE92Lm",
      "4yphpk5D1hx7hku3d3bq39bPgSceRhWdo7C6b9CmVeAPRgEcNJAoUhX856FhzqAUS6ZrSUU6Ek6LncbmnYZH2fUd",
      "5jyP2kN49hoSB4RxLXLkLM9rfpJSEsDZsuVT3vaSqBDigWZqufMwgssHABasfxt1X8eMejmVNbihfUE5mUAzxc82",
      "3FnuCQqpvg4n4FSGw1NRVf9Hzj3ZXGcEHA5PvNdriGxjqwjv7jbQdkQtAaHCbgsWyYeNLXizTpNVGmao11ZAppoW",
      "pJSRTEDLsCtprNFNd5DkNAuJdjriWLoLEZE5PoQtB7jGms2f7CFAmfUNk1RVZmjFkYhqx8ogqodYqSPEsmJDSTp",

      "2YvoZq3JtCexZ5xZCVLUVRedKWXYn1h3QwD6TE9rgDubApPB5KBcg9tvG7GXUa3Vui8txuL9P43Cxxbg4Tvp8s92",
      "23m6BmXvBqCJkJVGWGqGqB7p9Z7bwVcoTVh6CakGDbRoPQfGFpi2v1DfSQptpc9rNM3ZGV2JgGfjRwKGvq4Jqa7Y",
      "5MPEBtUZVcGZJ9sTQvsNEeN31ZQX56Z2N53mN6vpZbzR6aZfVFQnWTwkuNwdDmnF68sps9Jv7WyVHckr1qrCGC4a",
      "5Go9fhn8g9seJSwoC3yMsbGbW3xTwPpbk9Y79d5tXRv8y4mZAUCX9aRpbc7KP4YGkPE3smUNeD3S3wUoyLbLtzXQ",
      "5bCZJ3RYAxMCARtGX5J56CR8vwTp9xVUsffoLAbBrpTqiN2h9xCyeVhxSi38dMEonVcAxDTBni5c8cnWnRxhFXht",
      "4K2dNgYWGh3VFQjkPvqY4kWfi6N3mTqfBhvWjxfzPmw9UfMKypQRbRiJJRtPnKTwhdj8sVyEB9UamrNuHhxE92Lm",
      "4yphpk5D1hx7hku3d3bq39bPgSceRhWdo7C6b9CmVeAPRgEcNJAoUhX856FhzqAUS6ZrSUU6Ek6LncbmnYZH2fUd",
      "5jyP2kN49hoSB4RxLXLkLM9rfpJSEsDZsuVT3vaSqBDigWZqufMwgssHABasfxt1X8eMejmVNbihfUE5mUAzxc82",
      "3FnuCQqpvg4n4FSGw1NRVf9Hzj3ZXGcEHA5PvNdriGxjqwjv7jbQdkQtAaHCbgsWyYeNLXizTpNVGmao11ZAppoW",
      "pJSRTEDLsCtprNFNd5DkNAuJdjriWLoLEZE5PoQtB7jGms2f7CFAmfUNk1RVZmjFkYhqx8ogqodYqSPEsmJDSTp",

      "2YvoZq3JtCexZ5xZCVLUVRedKWXYn1h3QwD6TE9rgDubApPB5KBcg9tvG7GXUa3Vui8txuL9P43Cxxbg4Tvp8s92",
      "23m6BmXvBqCJkJVGWGqGqB7p9Z7bwVcoTVh6CakGDbRoPQfGFpi2v1DfSQptpc9rNM3ZGV2JgGfjRwKGvq4Jqa7Y",
      "5MPEBtUZVcGZJ9sTQvsNEeN31ZQX56Z2N53mN6vpZbzR6aZfVFQnWTwkuNwdDmnF68sps9Jv7WyVHckr1qrCGC4a",
      "5Go9fhn8g9seJSwoC3yMsbGbW3xTwPpbk9Y79d5tXRv8y4mZAUCX9aRpbc7KP4YGkPE3smUNeD3S3wUoyLbLtzXQ",
      "5bCZJ3RYAxMCARtGX5J56CR8vwTp9xVUsffoLAbBrpTqiN2h9xCyeVhxSi38dMEonVcAxDTBni5c8cnWnRxhFXht",
      "4K2dNgYWGh3VFQjkPvqY4kWfi6N3mTqfBhvWjxfzPmw9UfMKypQRbRiJJRtPnKTwhdj8sVyEB9UamrNuHhxE92Lm",
      "4yphpk5D1hx7hku3d3bq39bPgSceRhWdo7C6b9CmVeAPRgEcNJAoUhX856FhzqAUS6ZrSUU6Ek6LncbmnYZH2fUd",
      "5jyP2kN49hoSB4RxLXLkLM9rfpJSEsDZsuVT3vaSqBDigWZqufMwgssHABasfxt1X8eMejmVNbihfUE5mUAzxc82",
      "3FnuCQqpvg4n4FSGw1NRVf9Hzj3ZXGcEHA5PvNdriGxjqwjv7jbQdkQtAaHCbgsWyYeNLXizTpNVGmao11ZAppoW",
      "pJSRTEDLsCtprNFNd5DkNAuJdjriWLoLEZE5PoQtB7jGms2f7CFAmfUNk1RVZmjFkYhqx8ogqodYqSPEsmJDSTp",

      "2YvoZq3JtCexZ5xZCVLUVRedKWXYn1h3QwD6TE9rgDubApPB5KBcg9tvG7GXUa3Vui8txuL9P43Cxxbg4Tvp8s92",
      "23m6BmXvBqCJkJVGWGqGqB7p9Z7bwVcoTVh6CakGDbRoPQfGFpi2v1DfSQptpc9rNM3ZGV2JgGfjRwKGvq4Jqa7Y",
      "5MPEBtUZVcGZJ9sTQvsNEeN31ZQX56Z2N53mN6vpZbzR6aZfVFQnWTwkuNwdDmnF68sps9Jv7WyVHckr1qrCGC4a",
      "5Go9fhn8g9seJSwoC3yMsbGbW3xTwPpbk9Y79d5tXRv8y4mZAUCX9aRpbc7KP4YGkPE3smUNeD3S3wUoyLbLtzXQ",
      "5bCZJ3RYAxMCARtGX5J56CR8vwTp9xVUsffoLAbBrpTqiN2h9xCyeVhxSi38dMEonVcAxDTBni5c8cnWnRxhFXht",
      "4K2dNgYWGh3VFQjkPvqY4kWfi6N3mTqfBhvWjxfzPmw9UfMKypQRbRiJJRtPnKTwhdj8sVyEB9UamrNuHhxE92Lm",
      "4yphpk5D1hx7hku3d3bq39bPgSceRhWdo7C6b9CmVeAPRgEcNJAoUhX856FhzqAUS6ZrSUU6Ek6LncbmnYZH2fUd",
      "5jyP2kN49hoSB4RxLXLkLM9rfpJSEsDZsuVT3vaSqBDigWZqufMwgssHABasfxt1X8eMejmVNbihfUE5mUAzxc82",
      "3FnuCQqpvg4n4FSGw1NRVf9Hzj3ZXGcEHA5PvNdriGxjqwjv7jbQdkQtAaHCbgsWyYeNLXizTpNVGmao11ZAppoW",
      "pJSRTEDLsCtprNFNd5DkNAuJdjriWLoLEZE5PoQtB7jGms2f7CFAmfUNk1RVZmjFkYhqx8ogqodYqSPEsmJDSTp",

      "2YvoZq3JtCexZ5xZCVLUVRedKWXYn1h3QwD6TE9rgDubApPB5KBcg9tvG7GXUa3Vui8txuL9P43Cxxbg4Tvp8s92",
      "23m6BmXvBqCJkJVGWGqGqB7p9Z7bwVcoTVh6CakGDbRoPQfGFpi2v1DfSQptpc9rNM3ZGV2JgGfjRwKGvq4Jqa7Y",
      "5MPEBtUZVcGZJ9sTQvsNEeN31ZQX56Z2N53mN6vpZbzR6aZfVFQnWTwkuNwdDmnF68sps9Jv7WyVHckr1qrCGC4a",
      "5Go9fhn8g9seJSwoC3yMsbGbW3xTwPpbk9Y79d5tXRv8y4mZAUCX9aRpbc7KP4YGkPE3smUNeD3S3wUoyLbLtzXQ",
      "5bCZJ3RYAxMCARtGX5J56CR8vwTp9xVUsffoLAbBrpTqiN2h9xCyeVhxSi38dMEonVcAxDTBni5c8cnWnRxhFXht",
      "4K2dNgYWGh3VFQjkPvqY4kWfi6N3mTqfBhvWjxfzPmw9UfMKypQRbRiJJRtPnKTwhdj8sVyEB9UamrNuHhxE92Lm",
      "4yphpk5D1hx7hku3d3bq39bPgSceRhWdo7C6b9CmVeAPRgEcNJAoUhX856FhzqAUS6ZrSUU6Ek6LncbmnYZH2fUd",
      "5jyP2kN49hoSB4RxLXLkLM9rfpJSEsDZsuVT3vaSqBDigWZqufMwgssHABasfxt1X8eMejmVNbihfUE5mUAzxc82",
      "3FnuCQqpvg4n4FSGw1NRVf9Hzj3ZXGcEHA5PvNdriGxjqwjv7jbQdkQtAaHCbgsWyYeNLXizTpNVGmao11ZAppoW",
      "pJSRTEDLsCtprNFNd5DkNAuJdjriWLoLEZE5PoQtB7jGms2f7CFAmfUNk1RVZmjFkYhqx8ogqodYqSPEsmJDSTp"
    ]

    const start = process.hrtime();
    const promiseArr = []
    hashes.forEach(hash => {
      promiseArr.push(new Promise((resolve, reject) => {
        this.scanService.mergePfHashV2(hash, 1).then(resolve).catch(reject);
      }))
    })

    Promise.all(promiseArr).finally(()=>{
      const end = process.hrtime(start);
      this.logger.log(`并发:${hashes.length},耗时: ${end[0]+'.'+end[1]+'s'}`)
    });
  }

}

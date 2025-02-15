import { Injectable, Logger } from '@nestjs/common';
import Redis, { Cluster, ClusterOptions, CommonRedisOptions } from 'ioredis';
import { ClusterNode } from 'ioredis/built/cluster';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  public readonly uuid: string = this.generateUuid();

  private redis: Redis | undefined;

  private cluster: Cluster | undefined;

  private isCluster = false;

  private keyPrefix: string | undefined

  private _connected: boolean = false;

  init(){
    this.logger.log('Redis service start init...');
    // @ts-ignore
    this.keyPrefix = process.env.REDIS_KEY_PREFIX
    this.isCluster = 'true' == process.env.REDIS_IS_CLUSTER
    if (this.isCluster) {
      //exp: 192.168.2.41:6379,192.168.2.46:6379,192.168.2.47:6379
      // @ts-ignore
      const nodesStr = process.env.REDIS_CLUSTER_NODES.split(",")
      const clusterNodes:ClusterNode[] = []
      nodesStr.forEach(node => {
        const hostPort = node.split(":")
        clusterNodes.push({host: hostPort[0], port: parseInt(hostPort[1])})
      })
      const options: ClusterOptions = {
        // @ts-ignore
        maxRedirections: parseInt(process.env.REDIS_CLUSTER_MAX_REDIRECTIONS),
        redisOptions: {password: process.env.REDIS_CLUSTER_PASSWORD} as CommonRedisOptions
      } as ClusterOptions;
      // @ts-ignore
      const cluster = new Redis.Cluster(clusterNodes,options);
      cluster.on('error', (error:Error) => {
        throw new Error(error.message)
      });
      cluster.on('connect', () => this.logger.log('Redis cluster connected'));
      this.cluster = cluster;
    } else {
      const redis = new Redis({
        host: process.env.REDIS_HOST,
        // @ts-ignore
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
        // @ts-ignore
        connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT),
        // @ts-ignore
        db: parseInt(process.env.REDIS_DB),
      });
      redis.on('error', (error:Error) => {
        throw new Error(error.message)
      });
      redis.on('connect', () => {
        this._connected = true
        this.logger.log('Redis connected')
      });
      this.redis = redis;
    }
  }

  public getClient():Redis|Cluster{
    // @ts-ignore
    return this.isCluster ? this.cluster : this.redis;
  }

  public getKey(key:string):Promise<string|null> {
    return this.getClient().get(key)
  }

  public setZincrby(key: string, increment: number | string, member: string | number):Promise<string> {
    return this.getClient().zincrby(key, increment, member)
  }

  public getZrevrange(key: string, start: number | string = 0, stop: number | string = 49):Promise<string[]> {
    return this.getClient().zrevrange(key, start, stop, "WITHSCORES")
  }

  /**
   *
   * @param key
   * @param val
   * @param unit EX: seconds, PX: milliseconds
   * @param unitTime
   */
  public setKey(key:string, val:any, unit?:string, unitTime?:number|string):Promise<string|null> {
    if(unit){
      // @ts-ignore
      return this.getClient().set(key,val,unit,unitTime)
    }else{
      return this.getClient().set(key,val)
    }

  }

  public combineKeyWithPrefix(name:string|number): string {
    return `${this.keyPrefix}:${name}`;
  }

  /**
   * Generate a uuid for identify each distributed node
   */
  private generateUuid(): string {
    let d = Date.now();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      (c: String) => {
        const r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      }
    );
  }

  /**
   * Try to lock once
   * @param {string} name lock name
   * @param {number} [expire] milliseconds, TTL for the redis key
   * @returns {boolean} true: success, false: failed
   */
  public async lockOnce(name:string, expire:number) {
    const result = await this.getClient().set(
      name,
      this.uuid,
      'PX',
      expire,
      'NX'
    );
    //console.debug(`lock: ${name}, result: ${result}`);
    return result !== null;
  }


  /**
   * Get a lock, automatically retrying if failed
   * @param {string} name lock name
   * @param {string} [expire] expire time
   * @param {number} [retryInterval] milliseconds, the interval to retry if failed
   * @param {number} [maxRetryTimes] max times to retry
   */
  public async lock(
    name: string,
    expire: number = 60000,
    retryInterval: number = 100,
    maxRetryTimes: number = 600
  ): Promise<void> {
    let retryTimes = 0;
    while (true) {
      if (await this.lockOnce(name, expire)) {
        break;
      } else {
        await this.sleep(retryInterval);
        if (retryTimes >= maxRetryTimes) {
          throw new Error(`RedisLockService: locking ${name} timed out`);
        }
        retryTimes++;
      }
    }
  }

  /**
   * Unlock a lock by name
   * @param {string} name lock name
   */
  public async unLock(name:string) {
    const client = this.getClient();
    const result = await client.eval(
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
      1,
      name,
      this.uuid
    );

    // console.debug(`unlock: ${name}, result: ${result}`);
  }

  /**
   * Set TTL for a lock
   * @param {string} name lock name
   * @param {number} milliseconds TTL
   */
  public async setTTL(name:string, milliseconds:number) {
    const client = this.getClient();
    const result = await client.pexpire(name, milliseconds);
    this.logger.log(`set TTL: ${name}, result: ${result}`);
  }

  /**
   * @param {number} ms milliseconds, the sleep interval
   */
  public sleep(ms: Number): Promise<Function> {
    return new Promise((resolve) => setTimeout(resolve, Number(ms)));
  }

  public async rpushBatch(queueName:string,tasks:string[]){
    const script = `
        local queue = KEYS[1]
        local tasks = ARGV

        for i, task in ipairs(tasks) do
            redis.call("RPUSH", queue, task)
        end

        return #tasks
    `;
    // @ts-ignore
    const insertedCount = await this.getClient().eval(script, 1, queueName, tasks);
    this.logger.log(`Inserted ${insertedCount} tasks into queue: ${queueName}`);
  }

  /**
   * @description 用redis实现的linkedHashMap put方法
   * @param key
   * @param hashKey hash key
   * @param value
   * @param ex 过期时间
   */
  public async linkedHashMapPut(key:string,hashKey:string,value:string,ex:number):Promise<any> {
    const end = new Date(2100,11,30).getTime();
    const sore = end - new Date().getTime();
    const script = `
         redis.call('zadd','${key}',${sore},'${hashKey}');
        redis.call('set','${key}:content:${hashKey}', ARGV[1],'EX',${ex});
    `
    await this.getClient().eval(script,0,value)
  };
  /**
   * @description 用redis实现的linkedHashMap remove方法
   * @param key
   * @param range 取多少个,当不传时，取出全部
   */
  public async linkedHashRemove(key:string,range?:number):Promise<string[]|null[]|null> {
    // local range = redis.call('ZCARD','${key}');
    const script = `
      local range = redis.call('ZCARD','${key}');
      local aa = redis.call('zrevrange','${key}',0,range);
      if next(aa) == nil then
        return nil;
      end
      local dd ={};
      for i = 1, #aa do  
        dd[i] = '${key}:content:' .. aa[i]
      end  
      local cc = redis.call('mget',unpack(dd));
      redis.call('ZREMRANGEBYRANK','${key}', 0, range);
      return cc; 
    `
    const scriptRange = `
      local aa = redis.call('zrevrange','${key}',0,${range});
      if next(aa) == nil then
        return nil;
      end
      local dd ={};
      for i = 1, #aa do  
        dd[i] = '${key}:content:' .. aa[i]
      end  
      local cc = redis.call('mget',unpack(dd));
      redis.call('ZREMRANGEBYRANK','${key}', 0, ${range});
      return cc; 
    `;
    //@ts-ignore
    return await this.getClient().eval(range ? scriptRange : script, 0)
  }

  isConnected(): boolean {
    return this._connected;
  }

  public async countKeysWithPattern(pattern:string):Promise<number> {
    let cursor = '0'; // 初始游标
    let count = 0; // 匹配的键数量
    do {
      // 使用 SCAN 命令进行增量扫描
      const [newCursor, keys] = await this.getClient().scan(cursor, 'MATCH', pattern, 'COUNT', 1000);
      // 增加计数
      count += keys.length;
      // 更新游标
      cursor = newCursor;
    } while (cursor !== '0'); // 直到游标为 0，表示扫描结束
    return count;
  }
}

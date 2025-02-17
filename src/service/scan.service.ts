import { Injectable, Logger } from '@nestjs/common';
import { Connection, Context, Logs } from '@solana/web3.js';
import { RedisService } from './redis.service';
import {
  OPAQUE_SIGNATURE,
  PF_LOG_PREFIX,
  PF_LOG_SUCCESS,
  PF_LOG_TRADE_DATA_ENCODED_PREFIX,
  PF_LOG_TRADE_DATA_ENCODED_PREFIX_OFFSET,
  PF_LOG_TRADE_TOTAL_LENGTH,
  PF_PROGRAM_ID, PfHashTaskData,
  PfTradeEventLayout,
} from '../dto/common.dto';
import Utils from '../utils';
import { PfTrade } from '../entities/PfTrade';
import { DataSource, In, MoreThanOrEqual, Repository } from 'typeorm';
import { EventParser } from '../dto/event.parser';
import { DataBucket } from '../dto/DataBucket';
import { PfCreate } from '../entities/PfCreate';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BullQueueName, BullTaskName, RedisKeys } from '../config/constants';
import { ConfigService } from '@nestjs/config';
import { SolanaSlot } from '../entities/SolanaSlot';
import { Buffer } from 'buffer';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UserTrade } from '../entities/UserTrade';
import { UserToken } from 'src/entities/UserToken';
import { PfTxConf } from '../entities/PfTxConf';
import { PfTxId } from '../entities/PfTxId';

@Injectable()
export class ScanService{
  private readonly logger = new Logger(ScanService.name);
  private provider: Connection;
  private providerV2: Connection;
  private eventParser: EventParser;
  private listenerLogSubscriptionId: number = 0;
  private readonly startSlotNumber: number;
  private readonly intervalNumber: number;
  private readonly taskSize: number;
  private readonly parsePfHashTaskSize: number;
  constructor(
    //@InjectRepository(PfTrade)
    //private readonly pfTradeRepository: Repository<PfTrade>,
    @InjectQueue(BullQueueName.SLOT_QUEUE)
    private slotQueue: Queue,
    private dataSource: DataSource,
    private readonly redisService: RedisService,
    private configService: ConfigService,
    @InjectRepository(SolanaSlot)
    private readonly slotRepository: Repository<SolanaSlot>,
    //@InjectRepository(PfCreate)
    //private readonly pfCreateRepository: Repository<PfCreate>,
    //@InjectRepository(PfTrade)
    //private readonly pfTradeRepository: Repository<PfTrade>,
    //@InjectRepository(UserTrade)
    //private readonly userTradeRepository: Repository<UserTrade>,
    //@InjectRepository(UserToken)
    //private readonly userTokenRepository: Repository<UserToken>,
    @InjectRepository(PfTxConf)
    private readonly pfTxConfRepository: Repository<PfTxConf>,
    @InjectRepository(PfTxId)
    private readonly pfTxIdRepository: Repository<PfTxId>,
    private readonly httpService: HttpService
  ) {
    this.provider = new Connection(this.configService.get("SOLANA_URL"), {commitment:"confirmed", wsEndpoint: this.configService.get("SOLANA_WSS")})
    this.providerV2 = new Connection(this.configService.get("SOLANA_URL2"), {commitment:"confirmed", wsEndpoint: this.configService.get("SOLANA_WSS2")})
    this.eventParser = new EventParser()
    this.startSlotNumber = Number(this.configService.get('SCAN_BLOCK_START'));
    this.intervalNumber = Number(this.configService.get('SCAN_BLOCK_INTERVAL'));
    this.taskSize = Number(this.configService.get('SCAN_BLOCK_TASK_SIZE'));
    this.parsePfHashTaskSize = Number(this.configService.get('PARSE_PF_HASH_TASK_SIZE'));
  }

  async refreshBlockNumber(){
    try {
      let lastSlotNumber = this.startSlotNumber
      const lastSlot = await this.getLastSlot()
      if (lastSlot) {
        lastSlotNumber = lastSlot.id + 1;
      }
      const endSlotNumber = lastSlotNumber + this.intervalNumber;
      this.logger.log(`refresh BlockNumber: S:${lastSlotNumber}, E:${endSlotNumber}`);
      const blockNumbers = await this.provider.getBlocks(lastSlotNumber, endSlotNumber, 'finalized');
      if (blockNumbers && blockNumbers.length > 0) {
        this.logger.log(`refresh BlockNumber: found ${blockNumbers.length} blocks`);
        const slots = blockNumbers.map(item => {
          return {
            id: item,
            status: 0,
          } as SolanaSlot;
        });
        await this.batchAddSlot(slots);
      }
    } catch (e) {
      this.logger.error(e);
    }
  }

  parseLogs(logs: string[]): PfTradeEventLayout | null {
    const logsLength = logs.length;
    if (!logs || logsLength < 3) {
      return null;
    }

    for (let idx = 1; idx < logsLength; ++idx) {
      if (logs[idx].length !== PF_LOG_TRADE_TOTAL_LENGTH || !logs[idx].startsWith(PF_LOG_TRADE_DATA_ENCODED_PREFIX, PF_LOG_TRADE_DATA_ENCODED_PREFIX_OFFSET)) {
        continue;
      }

      if (logs[idx - 1] !== PF_LOG_SUCCESS && (idx !== (logsLength - 1) && !logs[idx + 1].startsWith(PF_LOG_PREFIX))) {
        continue;
      }

      try {
        const rawData = Buffer.from(logs[idx].slice(PF_LOG_TRADE_DATA_ENCODED_PREFIX_OFFSET), "base64");
        return PfTradeEventLayout.decode(Buffer.from(rawData.buffer, rawData.byteOffset + 8, rawData.byteLength - 8));
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  async getBlock(slot:number){
    const params = {
      id: slot,
      jsonrpc: "2.0",
      method: "getBlock",
      params: [
        slot,
        {
          encoding: "json",
          maxSupportedTransactionVersion: 0,
          transactionDetails: "full",
          rewards: false
        }
      ]
    }
    const config = {
        headers: {
          'Content-Type':"application/json"
        }
      }
    return await firstValueFrom(this.httpService.post(this.configService.get("SOLANA_URL"), params, config))
  }

  async parseTx(txHash: string) {
    const transaction = await this.provider.getParsedTransaction(txHash, { maxSupportedTransactionVersion: 0 });
    //console.log(transaction);
    if(transaction?.meta?.logMessages){
      const trade: PfTradeEventLayout = this.parseLogs(transaction.meta.logMessages)
      if(trade){
        (trade as any).bondingCurve = Utils.findPfBondingCurveAddress(trade.mint);
        //console.log(ctx.slot, txLogs.signature);
        console.log(JSON.stringify(
          Object.fromEntries(Object.entries(trade).map(([k, v]) => [k, v !== null && (typeof v === "object" || typeof v === "bigint") ? String(v) : v])),
          null, 2,
        ));
        console.log();
      }
    }
  }

  async parseBlock(slot:number){
    const start = process.hrtime();
    const resp = await this.provider.getBlock(slot, { maxSupportedTransactionVersion: 0, rewards: false })
    //const resp = await this.getBlock(slot)
    //console.log("resp",resp.data.id)
    this.logger.log(`Parse block: slot:${slot},blockTime:${resp.blockTime},txSize:${resp.transactions.length}`)
    const bucket = new DataBucket(slot);
    bucket.needUpdateSlot = true;
    for (let i = 0; i < resp.transactions.length; i++) {
      const tx = resp.transactions[i]
      if(!tx.meta.err && tx.meta.logMessages){
        this.eventParser.dealLogs(tx.meta.logMessages, tx.transaction.signatures[0], slot, bucket)
      }
    }
    await this.saveDataBucket(bucket)
    const end = process.hrtime(start);
    this.logger.log(`Parse block: slot:${slot},cost: ${end[0]+'.'+end[1]+'s'} tradeEvent: ${bucket.pfTradeList.length}, createEvent: ${bucket.pfCreateList.length}`)
  }


  async parseTx2(txHash: string) {
    console.log("txHash", txHash);
    //const transaction = await this.provider.getParsedTransaction(txHash, { maxSupportedTransactionVersion: 0 });
    //console.log(transaction);
    //if(transaction?.meta?.logMessages){
/*    const logs =  [
        'Program VFeesufQJnGunv2kBXDYnThT1CoAYB45U31qGDe5QjU invoke [1]',
        'Program log: Instruction: RecordSolBalance',
        'Program 11111111111111111111111111111111 invoke [2]',
        'Program 11111111111111111111111111111111 success',
        'Program VFeesufQJnGunv2kBXDYnThT1CoAYB45U31qGDe5QjU consumed 7354 of 150000 compute units',
        'Program VFeesufQJnGunv2kBXDYnThT1CoAYB45U31qGDe5QjU success',
        'Program ComputeBudget111111111111111111111111111111 invoke [1]',
        'Program ComputeBudget111111111111111111111111111111 success',
        'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P invoke [1]',
        'Program log: Instruction: Sell',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
        'Program log: Instruction: Transfer',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 119556 compute units',
        'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
        'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P invoke [2]',
        'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P consumed 2132 of 111245 compute units',
        'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P success',
        'Program data: vdt/007mYe6gL5m+fnIMUqrSdGMqJbH2Kr9QqW/HiDHFgqw3s2SQ+iftFQAAAAAAltbicwUAAAAA6d5AfAUxm4m9/DxrS46l+lH7VmUypjn1r9pbwM9cjXZ5vKFnAAAAAOiA8FgKAAAAy1RRVsOSAgDo1MxcAwAAAMu8PgoylAEA',
        'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P consumed 35588 of 142496 compute units',
        'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P success',
        'Program ComputeBudget111111111111111111111111111111 invoke [1]',
        'Program ComputeBudget111111111111111111111111111111 success',
        'Program VFeesufQJnGunv2kBXDYnThT1CoAYB45U31qGDe5QjU invoke [1]',
        'Program log: Instruction: SendFeesSolRecorded',
        'Program 11111111111111111111111111111111 invoke [2]',
        'Program 11111111111111111111111111111111 success',
        'Program VFeesufQJnGunv2kBXDYnThT1CoAYB45U31qGDe5QjU consumed 7428 of 106758 compute units',
        'Program VFeesufQJnGunv2kBXDYnThT1CoAYB45U31qGDe5QjU success'
      ]*/
    const logs =  [
      'Program ComputeBudget111111111111111111111111111111 invoke [1]',
      'Program ComputeBudget111111111111111111111111111111 success',
      'Program ComputeBudget111111111111111111111111111111 invoke [1]',
      'Program ComputeBudget111111111111111111111111111111 success',
      'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P invoke [1]',
      'Program log: Instruction: Create',
      'Program 11111111111111111111111111111111 invoke [2]',
      'Program 11111111111111111111111111111111 success',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
      'Program log: Instruction: InitializeMint2',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2780 of 237885 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program 11111111111111111111111111111111 invoke [2]',
      'Program 11111111111111111111111111111111 success',
      'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [2]',
      'Program log: Create',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
      'Program log: Instruction: GetAccountDataSize',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1595 of 215371 compute units',
      'Program return: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA pQAAAAAAAAA=',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program 11111111111111111111111111111111 invoke [3]',
      'Program 11111111111111111111111111111111 success',
      'Program log: Initialize the associated token account',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
      'Program log: Instruction: InitializeImmutableOwner',
      'Program log: Please upgrade to SPL Token 2022 for immutable owner support',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1405 of 208758 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]',
      'Program log: Instruction: InitializeAccount3',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4214 of 204874 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 20490 of 220846 compute units',
      'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success',
      'Program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s invoke [2]',
      'Program log: IX: Create Metadata Accounts v3',
      'Program 11111111111111111111111111111111 invoke [3]',
      'Program 11111111111111111111111111111111 success',
      'Program log: Allocate space for the account',
      'Program 11111111111111111111111111111111 invoke [3]',
      'Program 11111111111111111111111111111111 success',
      'Program log: Assign the account to the owning program',
      'Program 11111111111111111111111111111111 invoke [3]',
      'Program 11111111111111111111111111111111 success',
      'Program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s consumed 40040 of 183649 compute units',
      'Program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s success',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
      'Program log: Instruction: MintTo',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4492 of 140484 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
      'Program log: Instruction: SetAuthority',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 2911 of 133415 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P invoke [2]',
      'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P consumed 2132 of 126284 compute units',
      'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P success',
      'Program data: G3KpTd7rY3YQAAAAQ3J5cHRvIFBheW1lZW50cwcAAABUQVRBV0FNQwAAAGh0dHBzOi8vaXBmcy5pby9pcGZzL1FtWndrTThMOGhobkg1dWFtMTV0OWhpMlVMalNwRXBXM0hFUmhYUmFNd0hNeU0KYEySFh5DPsS1AE7OlKfNpZubcr9MRuiv51JIlBY8/1sKgrocjuOTYR0fN/CRe5rBdHhPKR2zVKy+GspcI0XOJoBCLirj3YBk8JHwtEPA0niNDbevObo9uQ9VZRKSgXI=',
      'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P consumed 127950 of 249700 compute units',
      'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P success',
      'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL invoke [1]',
      'Program log: Create',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
      'Program log: Instruction: GetAccountDataSize',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1569 of 116387 compute units',
      'Program return: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA pQAAAAAAAAA=',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program 11111111111111111111111111111111 invoke [2]',
      'Program 11111111111111111111111111111111 success',
      'Program log: Initialize the associated token account',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
      'Program log: Instruction: InitializeImmutableOwner',
      'Program log: Please upgrade to SPL Token 2022 for immutable owner support',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 1405 of 109800 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
      'Program log: Instruction: InitializeAccount3',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4188 of 105920 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL consumed 20301 of 121750 compute units',
      'Program ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL success',
      'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P invoke [1]',
      'Program log: Instruction: Buy',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]',
      'Program log: Instruction: Transfer',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 81435 compute units',
      'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
      'Program 11111111111111111111111111111111 invoke [2]',
      'Program 11111111111111111111111111111111 success',
      'Program 11111111111111111111111111111111 invoke [2]',
      'Program 11111111111111111111111111111111 success',
      'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P invoke [2]',
      'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P consumed 2132 of 68865 compute units',
      'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P success',
      'Program data: vdt/007mYe4KYEySFh5DPsS1AE7OlKfNpZubcr9MRuiv51JIlBY8/wDSSWsAAAAAW0m1Kj03AAABJoBCLirj3YBk8JHwtEPA0niNDbevObo9uQ9VZRKSgXIdhqRnAAAAAAB+bWcHAAAApcYiHaaYAwAA0klrAAAAAKUuENEUmgIA',
      'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P consumed 36920 of 101449 compute units',
      'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P success'
    ]
    const bucket = new DataBucket(0);
    this.eventParser.dealLogs(logs,txHash, 123456789, bucket)
    await this.saveDataBucket(bucket)
    //}
  }

  async tradeList() {
/*    const transaction = await this.provider.getParsedTransaction(txHash, { maxSupportedTransactionVersion: 0 });
    //console.log(transaction);
    if(transaction?.meta?.logMessages){
      this.eventParser.dealLogs(transaction?.meta?.logMessages, txHash)
    }*/
    const queryRunner = this.dataSource.createQueryRunner();
    return await queryRunner.manager.find(PfTrade, {
      where: { id: MoreThanOrEqual(6) },
    }).finally(()=>{
      queryRunner.release().catch(()=>{})
    })
  }

  async getLastSlot(): Promise<SolanaSlot> {
    const latestSlots = await this.slotRepository.find({
      order: { id: 'DESC' },  // 按 id 降序排列
      take: 1,                // 限制返回 1 条记录
    })

/*    const queryRunner = this.dataSource.createQueryRunner();
    const latestSlots = await queryRunner.manager.find(SolanaSlot, {
      order: { id: 'DESC' },  // 按 id 降序排列
      take: 1,                // 限制返回 1 条记录
    }).finally(()=>{
      queryRunner.release().catch(()=>{})
    });*/
    return latestSlots[0]
  }

  async getSlots(): Promise<SolanaSlot[]> {
    return await this.slotRepository.find({
      where: { status: 0 }, //未处理的
      order: { id: 'ASC' }, //先处理最旧的
      take: this.taskSize
    })
/*    const queryRunner = this.dataSource.createQueryRunner();
    return await queryRunner.manager.find(SolanaSlot, {
      where: { status: 0 }, //未处理的
      order: { id: 'ASC' }, //先处理最旧的
      take: this.taskSize
    }).finally(()=>{
      queryRunner.release().catch(()=>{})
    })*/
  }

  async sendTask(){
    const jobCount = await this.getJobsCount();
    if(jobCount > 3){
      return
    }
    const slots = await this.getSlots();
    if(slots && slots.length > 0){
      const tasks = slots.map(slot => {
          return {
            name: BullTaskName.SLOT_TASK,
            data: slot.id,
            opts: {jobId: BullQueueName.JOB_ID+":"+slot.id, removeOnComplete:true, removeOnFail:true}};
        })
      await this.slotQueue.addBulk(tasks)
    }
  }

  async getJobsCount():Promise<number>{
    const pattern = BullQueueName.PREFIX+":"+BullQueueName.SLOT_QUEUE+":"+BullQueueName.JOB_ID+":*"
    return this.redisService.countKeysWithPattern(pattern)
  }

  async getParsePfHashJobsCount():Promise<number>{
    const pattern = BullQueueName.PREFIX+":"+BullQueueName.SLOT_QUEUE+":"+BullQueueName.PARSE_PF_HASH_JOB_ID+":*"
    return this.redisService.countKeysWithPattern(pattern)
  }

  async getParsePfHash(): Promise<PfTxId[]> {
    return await this.pfTxIdRepository.find({
      where: { status: 0 }, //未处理的
      order: { id: 'ASC' }, //先处理最旧的
      take: this.parsePfHashTaskSize
    })
  }

  async sendParsePfHashTask(){
    const key = this.redisService.combineKeyWithPrefix(RedisKeys.SEND_PARSE_PF_HASH_TASK_LOCK)
    const isLocked = await this.redisService.lockOnce(key, 180 * 1000).catch(e => {
      this.logger.warn("send parse pf hash task: cannot get distributed lock");
    });
    if (!isLocked) {
      return
    }
    try {
      const jobCount = await this.getParsePfHashJobsCount();
      if (jobCount > 10) {
        return;
      }
      const pfHashes = await this.getParsePfHash();
      if (pfHashes && pfHashes.length > 0) {
        const tasks = pfHashes.map(item => {
          return {
            name: BullTaskName.PARSE_PF_HASH_TASK,
            data: item,
            opts: {
              jobId: BullQueueName.PARSE_PF_HASH_JOB_ID + ':' + item.id,
              removeOnComplete: true,
              removeOnFail: { age: 3600, count: 5000 },
              attempts: 30,
              backoff: { type: 'exponential', delay: 10000 },
            },
          };
        });
        await this.slotQueue.addBulk(tasks);
      }
    } finally {
      await this.redisService.unLock(key)
    }
  }

  async dealParsePfHashTask(data: PfTxId){
    const key = this.redisService.combineKeyWithPrefix(RedisKeys.PARSE_PF_HASH_LOCK+data.txId)
    const isLocked = await this.redisService.lockOnce(key, 20 * 1000).catch(e => {
      this.logger.warn("parse pf hash task: cannot get distributed lock");
    });
    if (!isLocked) {
      return
    }
    try {
      const start = process.hrtime();
      const resp = await this.providerV2.getParsedTransaction(data.txId, { maxSupportedTransactionVersion: 0 });
      const bucket = new DataBucket(data.blockNumber);
      bucket.pfHashRecordId = data.id;
      if (!resp.meta.err && resp.meta.logMessages) {
        this.eventParser.dealLogs(resp.meta.logMessages, data.txId, data.blockNumber, bucket);
        await this.saveDataBucket(bucket).catch((err) => {
          if (err?.message?.includes('duplicate key')) {
            this.updatePfHashRecordStatus(bucket.pfHashRecordId);
          } else {
            return Promise.reject(err);
          }
        });
      }
      const end = process.hrtime(start);
      this.logger.log(`parse pf hash task, id:${data.id},block:${data.blockNumber},cost:${end[0] + '.' + end[1] + 's'},`);
    } catch (e) {
      this.redisService.unLock(key)
      throw e
    }
  }

  async saveDataBucket(bucket:DataBucket) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let txId;
    try {
      if(bucket.pfTradeList.length > 0){
        txId = bucket.pfTradeList[0].txId
        await queryRunner.manager.insert(PfTrade, bucket.pfTradeList)
      }
      if(bucket.pfCreateList.length > 0){
        await queryRunner.manager.insert(PfCreate, bucket.pfCreateList)
      }
      if(bucket.pfHashRecordId){
        await queryRunner.manager.update(PfTxId, {id: bucket.pfHashRecordId }, { status: 1 });
      }
      if(bucket.needUpdateSlot){
        await queryRunner.manager.update(SolanaSlot, {id: bucket.slotId }, { status: 1 });
      }
      await queryRunner.commitTransaction();
      //this.logger.log(`save data bucket: pfHashRecordId:${bucket.pfHashRecordId},slotId:${bucket.slotId},tradeSize:${bucket.pfTradeList.length},createSize:${bucket.pfCreateList.length}`)
    } catch (err) {
      this.logger.error(`slotId:${bucket.slotId},pfHashRecordId:${bucket.pfHashRecordId??0},txId:${txId}`+ err.message)
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction().catch(()=>{});
      //抛向外层处理
      throw err
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release().catch(()=>{});
    }
  }


  async updatePfHashRecordStatus(pfHashRecordId:number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
        await queryRunner.manager.update(PfTxId, {id: pfHashRecordId }, { status: 1 });
        await queryRunner.commitTransaction();
      this.logger.log(`pf trade exists,only update pfHashRecord:${pfHashRecordId}`)
    } catch (err) {
      this.logger.error(err.message)
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction().catch(()=>{});
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release().catch(()=>{});
    }
  }


  async saveDataBucketWithDistributedLock(bucket:DataBucket, lockSuffix:string) {
    const key = this.redisService.combineKeyWithPrefix(RedisKeys.INSERT_DATA_BUCKET_LOCK+lockSuffix)
    const isLocked = await this.redisService.lockOnce(key, 120 * 1000).catch(e => {
      this.logger.warn("save DataBucket: cannot get distributed lock");
    });
    if (!isLocked) {
      return
    }
    try {
      await this.saveDataBucket(bucket)
    } catch (err) {
      if (err?.message?.includes('duplicate key')) {
        //nothing todo
      }else{
        await this.redisService.unLock(key)
        throw err
      }
    }
  }

  async saveTrade(trade: PfTrade) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.insert(PfTrade, trade)
      await queryRunner.commitTransaction();
    } catch (err) {
      console.error(err);
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction().catch(()=>{});
      throw err
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release().catch(()=>{});
    }
  }

  async batchAddSlot(list: SolanaSlot[]) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.insert(SolanaSlot, list)
      await queryRunner.commitTransaction();
    } catch (err) {
      console.error("insert batch slot failed", err.message);
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction().catch(()=>{});
      throw err
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await queryRunner.release().catch(()=>{});
    }
  }

  listenerLog(){
    const enable = this.configService.get('ENABLE_LISTENER_LOG')
    if(enable != 'true'){
      this.logger.warn('init listener log task is disabled')
      return
    }
    this.listenerLogSubscriptionId = this.provider.onLogs(PF_PROGRAM_ID, (txLogs: Logs, ctx: Context) => {
      if ((!ctx || !txLogs || txLogs.err !== null || !txLogs.logs || txLogs.logs.length < 3)
        || (!txLogs.signature || txLogs.signature === OPAQUE_SIGNATURE)) {
        return;
      }
      const bucket = new DataBucket(ctx.slot);
      this.eventParser.dealLogs(txLogs.logs, txLogs.signature, ctx.slot, bucket)
      this.slotQueue.add(BullTaskName.LOG_SUBSCRIBE_TASK, bucket, {jobId: BullQueueName.LOG_JOB_ID+":"+txLogs.signature, removeOnComplete:true,  removeOnFail: {age:3600, count:5000}, attempts: 30, backoff: {type: 'exponential', delay: 10000}})
    });

    return this.listenerLogSubscriptionId
  }

  async listenerLogEnd(){
    await this.provider.removeOnLogsListener(this.listenerLogSubscriptionId)
  }

  async initMergeTrade(){
    const enable = this.configService.get('ENABLE_MERGE_TRADE_TASK')
    if(enable != 'true'){
      this.logger.warn('init merge trade task is disabled')
      return
    }
    this.recursionMergeTrade()
    this.recursionMergeTradeClip()
    this.recursionMergeToken()
  }
  async recursionMergeTrade(){
    await this.mergeTrade().finally(()=>{
      Utils.sleep(2000).finally(()=>{
       this.recursionMergeTrade()
      })
    })
  }

  async recursionMergeTradeClip(){
    await this.mergeTradeClip().finally(()=>{
      Utils.sleep(5000).finally(()=>{
        this.recursionMergeTrade()
      })
    })
  }

  async recursionMergeToken(){
    await this.mergeToken().finally(()=>{
      Utils.sleep(5000).finally(()=>{
        this.recursionMergeTrade()
      })
    })
  }
  async mergeTrade(){
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const sql = 'SELECT ' +
        'string_agg(a.id::TEXT, \',\') AS ids,' +
        'a.user_adr,' +
        'SUM(a.sol_amount) AS total_sol_amounts,' +
        'SUM(a.token_amount) AS total_token_amounts ' +
        'FROM (SELECT * FROM pf_trade WHERE status = 0 ORDER BY id LIMIT 500) AS a ' +
        'GROUP BY a.user_adr';
      const start = process.hrtime();
      let foundPfTradeSize = 0
      let insertUserTradeSize = 0
      let updateUserTradeSize = 0
      let updatePfTradeSize = 0
      const results = await queryRunner.manager.query(sql);
      foundPfTradeSize = results?.length??0
      this.logger.log(`merge trade find: ${foundPfTradeSize}`);
      if (results && results.length > 0) {
        const map = new Map();
        const adrArr = [];
        let ids = '';
        results.forEach(e => {
          map.set(e.user_adr, e);
          adrArr.push(e.user_adr);
          ids += ',' + e.ids;
        });
        const updateTime = new Date()
        //const oldTrades = await this.userTradeRepository.find({ where: { userAdr: In(adrArr) } });
        const oldTrades = await queryRunner.manager.find(UserTrade, { where: { userAdr: In(adrArr) }})

        if (oldTrades && oldTrades.length > 0) {
          for (const trade of oldTrades) {
            const existsTrade = map.get(trade.userAdr);
            //trade.solAmount = trade.solAmount + Number(existsTrade.total_sol_amounts)
            //trade.tokenAmount = trade.tokenAmount + Number(existsTrade.total_token_amounts)
            map.delete(trade.userAdr);
           // const sql = 'UPDATE user_trade SET sol_amount=sol_amount+?,token_amount=token_amount+?,update_time=? WHERE user_adr = ?';
           // await queryRunner.query(sql, [Number(existsTrade.total_sol_amounts), Number(existsTrade.total_token_amounts),new Date(), trade.userAdr]);
            await queryRunner.manager.update(
              UserTrade,
              { userAdr: trade.userAdr},
              { solAmount: trade.solAmount + Number(existsTrade.total_sol_amounts),
                tokenAmount: trade.tokenAmount + Number(existsTrade.total_token_amounts),
                updateTime: updateTime
              }
            );
          }
          updateUserTradeSize = oldTrades.length
        }

        const newTrades = [];
        if (map.size > 0) {
          for (const item of map.values()) {
            const trade = new UserTrade();
            trade.userAdr = item.user_adr;
            trade.solAmount = Number(item.total_sol_amounts);
            trade.tokenAmount = Number(item.total_token_amounts);
            trade.type = 0;
            trade.status = 0;
            newTrades.push(trade);
          }
          await queryRunner.manager.insert(UserTrade, newTrades);
          insertUserTradeSize = newTrades.length;
        }

        const idArr = ids.substring(1).split(',')
        updatePfTradeSize = idArr.length;
        await queryRunner.manager.update(
          PfTrade,
          { id: In(idArr) },
          { status: 1,updateTime: updateTime },
        );
      }
      await queryRunner.commitTransaction();
      const end = process.hrtime(start);
      this.logger.log(`merge trade: cost ${end[0] + '.' + end[1] + 's'}, found:${foundPfTradeSize},insert:${insertUserTradeSize},update:${updateUserTradeSize},updatePfTrade:${updatePfTradeSize}`);
    } catch (err) {
      this.logger.error("merge trade failed",  err.message);
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction().catch(()=>{});
    } finally {
      await queryRunner.release().catch(()=>{})
    }

  }


  async mergeTradeClip(){
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const sql = 'SELECT \n' +
        'a.block_number,\n' +
        'a.user_adr\n' +
        'FROM (SELECT block_number,tx_id,user_adr FROM pf_trade WHERE block_number IN (SELECT DISTINCT block_number FROM pf_trade WHERE status = 1 AND update_time < NOW() - INTERVAL \'5 minutes\' LIMIT 1000)) AS a\n' +
        'GROUP BY a.block_number,a.tx_id,a.user_adr\n' +
        'HAVING COUNT(a.user_adr) > 1';
      const start = process.hrtime();
      let foundSize = 0
      let updatePfTradeSize = 0
      let updateUserTradeSize = 0
      const results = await queryRunner.manager.query(sql);
      foundSize = results?.length??0
      this.logger.log(`merge trade clip find: ${foundSize}`);
      if (results && results.length > 0) {
        const blockArr = [];
        const adrArr = [];
        results.forEach(e => {
          blockArr.push(e.block_number);
          adrArr.push(e.user_adr);
        });
        const updateTime = new Date()
        await queryRunner.manager.update(
          PfTrade,
          { blockNumber: In(blockArr) },
          { status: 2, updateTime: updateTime },
        )
        updatePfTradeSize = blockArr.length;

        await queryRunner.manager.update(
          UserTrade,
          { userAdr: In(adrArr) },
          { type: 1, updateTime: updateTime },
        )
        updateUserTradeSize = adrArr.length;
      }
      await queryRunner.commitTransaction();
      const end = process.hrtime(start);
      this.logger.log(`merge trade clip: cost ${end[0] + '.' + end[1] + 's'}, found:${foundSize},update:${updateUserTradeSize},updatePfTrade:${updatePfTradeSize}`);
    } catch (err) {
      this.logger.error("merge trade clip failed", err.message);
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction().catch(()=>{});
    } finally {
      await queryRunner.release().catch(()=>{})
    }
  }

  async mergeToken(){
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const sql = 'SELECT ' +
        'string_agg(a.id::TEXT, \',\') AS ids,' +
        'a.user_adr,' +
        'COUNT(*) AS total ' +
        'FROM (SELECT * FROM pf_create WHERE status = 0 LIMIT 500) AS a ' +
        'GROUP BY a.user_adr';
      const start = process.hrtime();
      let foundSize = 0
      let updatePfCreateSize = 0
      let insertUserTokenSize = 0
      let updateUserTokenSize = 0
      const results = await queryRunner.manager.query(sql);
      foundSize = results?.length??0
      this.logger.log(`merge token find: ${foundSize}`);
      if (results && results.length > 0) {
        const map = new Map();
        const adrArr = [];
        let ids = '';
        results.forEach(e => {
          map.set(e.user_adr, e);
          adrArr.push(e.user_adr);
          ids += ',' + e.ids;
        });

        //const oldTokens = await this.userTokenRepository.find({ where: { userAdr: In(adrArr) } });
        const oldTokens = await queryRunner.manager.find(UserToken, { where: { userAdr: In(adrArr) }})
        if (oldTokens && oldTokens.length > 0) {
          const updateTime = new Date()
          for (const token of oldTokens) {
            const existsToken = map.get(token.userAdr);
            map.delete(token.userAdr);
            await queryRunner.manager.update(
              UserToken,
              { userAdr: token.userAdr},
              { amount: token.amount + Number(existsToken.total),
                updateTime: updateTime
              }
            );
          }
          updateUserTokenSize = oldTokens.length
        }

        const newTokens = [];
        if (map.size > 0) {
          for (const item of map.values()) {
            const token = new UserToken();
            token.userAdr = item.user_adr;
            token.amount = Number(item.total);
            token.status = 0;
            newTokens.push(token);
          }
          await queryRunner.manager.insert(UserToken, newTokens);
          insertUserTokenSize = newTokens.length;
        }

        const idArr = ids.substring(1).split(',')
        await queryRunner.manager.update(
          PfCreate,
          { id: In(idArr) },
          { status: 1 },
        );
        updatePfCreateSize = idArr.length;
      }
      await queryRunner.commitTransaction();
      const end = process.hrtime(start);
      this.logger.log(`merge token: cost ${end[0] + '.' + end[1] + 's'}, found:${foundSize},insert:${insertUserTokenSize},update:${updateUserTokenSize},updatePfCreate:${updatePfCreateSize}`);
    } catch (err) {
      this.logger.error("merge token failed",  err.message);
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction().catch(()=>{});
    } finally {
      await queryRunner.release().catch(()=>{})
    }
  }

  async initMergePfHashTask(){
    const enable = this.configService.get('ENABLE_MERGE_PF_HASH_TASK')
    if(enable != 'true'){
      this.logger.warn('init merge pf hash task is disabled')
      return
    }
    //const resp = await this.pfTxConfRepository.find(
    //  { where: { status: 0, beforeBlockNumber: MoreThan(endBlockNumber) } }
    //)
    const resp = await this.dataSource
      .getRepository(PfTxConf)
      .createQueryBuilder("conf")
      .where("conf.status = 0 and conf.before_block_number > conf.end_block_number")
      .orderBy("conf.id", "ASC")
      .getMany()

    this.logger.log(`init merge pf hash task: ${resp?.length??0}`);
    if(resp && resp.length > 0){
      for (const conf of resp) {
         this.recursionMergePfHashTask({
           id: conf.id,
           beforeTxId: conf.beforeTxId,
           beforeBlockNumber: conf.beforeBlockNumber,
           endBlockNumber: conf.endBlockNumber
         } as PfHashTaskData)
      }
    }
/*    const tasks = resp.map(conf => {
      return this.makePfHashTask({
        id: conf.id,
        beforeTxId: conf.beforeTxId,
        beforeBlockNumber: conf.beforeBlockNumber,
        endBlockNumber: conf.endBlockNumber
      } as PfHashTaskData);
    })
    await this.slotQueue.addBulk(tasks)*/
  }

  async recursionMergePfHashTask(task: PfHashTaskData){
     const newTask = await this.dealPfHashTask(task)
    if(newTask){
      this.recursionMergePfHashTask(newTask)
    }
  }
  async dealPfHashTask(task: PfHashTaskData):Promise<PfHashTaskData> {
    const queryRunner = this.dataSource.createQueryRunner();
    let newTask = null
    //let dealSuccess = false;
    try {
      const start = process.hrtime();
      const options = { before: task.beforeTxId, limit: 1000}
      const resp = await this.provider.getSignaturesForAddress(PF_PROGRAM_ID, options, "finalized")
      if(resp && resp.length > 0){
        await queryRunner.connect();
        await queryRunner.startTransaction();
        const pfTxArr = []
        resp.forEach(item=>{
          //if(!item.err){
            const pfTx = new PfTxId()
            pfTx.txId = item.signature
            pfTx.blockNumber = item.slot
            pfTx.status = !item.err ? 0 : 2
            pfTxArr.push(pfTx)
          //}
        })
        if(pfTxArr.length > 0){
          await queryRunner.manager.insert(PfTxId,pfTxArr)
          const lastPfTx = pfTxArr[pfTxArr.length - 1]
          await queryRunner.manager.update(
            PfTxConf,
            { id: task.id},
            { beforeTxId: lastPfTx.txId,
              beforeBlockNumber: lastPfTx.blockNumber,
            }
          );
          if(lastPfTx.blockNumber > task.endBlockNumber){
            newTask = {
              id: task.id,
              beforeTxId: lastPfTx.txId,
              beforeBlockNumber: lastPfTx.blockNumber,
              endBlockNumber: task.endBlockNumber
            } as PfHashTaskData
          }
        }
        await queryRunner.commitTransaction();
      }
      const end = process.hrtime(start);
      this.logger.log(`merge pf hash, taskId: ${task.id}, ${task.beforeTxId}, ${task.beforeBlockNumber}, ${end[0] + '.' + end[1] + 's'}`);
      return newTask
    } catch (err) {
      this.logger.error(`merge pf hash failed, taskId: ${task.id}, ${task.beforeTxId}, ${task.beforeBlockNumber}`,  err.message);
      // since we have errors lets rollback the changes we made
      await queryRunner.rollbackTransaction().catch(()=>{})
      return task
    } finally {
      await queryRunner.release().catch(()=>{})
      //失败重试
/*      if(!dealSuccess){
        this.slotQueue.addBulk([this.makePfHashTask(task)])
      }else if(dealSuccess && newTask){
        this.slotQueue.addBulk([this.makePfHashTask(newTask)])
      }*/
    }
  }



  makePfHashTask(task: PfHashTaskData) {
    //this.slotQueue.add(BullTaskName.PF_HASH_TASK, task,  {jobId: BullQueueName.PF_HASH_JOB_ID+":"+newTask.id, removeOnComplete:true, removeOnFail:true})
    return {
      name: BullTaskName.PF_HASH_TASK,
      data: task,
      opts: {jobId: BullQueueName.PF_HASH_JOB_ID+":"+task.id, removeOnComplete:true, removeOnFail:true}
    }
  }


  async mergePfHashV2(beforeHash: string, index:number) {
    if(index > 10){
      return
    }
    const options = { before: beforeHash, limit: 1000}
    const start = process.hrtime();
    await this.provider.getSignaturesForAddress(PF_PROGRAM_ID, options, "finalized").then(async resp => {
      const end = process.hrtime(start);
      this.logger.log(`${beforeHash} => ${end[0] + '.' + end[1] + 's'}, ${resp?.length ?? 0}, ${index}`)
      if (resp && resp.length > 0) {
        const lastTxHash = resp[resp.length - 1].signature
        await this.mergePfHashV2(lastTxHash, index + 1)
      }
    }).catch(async (e) => {
      this.logger.log(`${beforeHash} err => ${e.message}`)
      await this.mergePfHashV2(beforeHash, index)
    })
  }

}

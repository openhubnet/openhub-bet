
import { PublicKey } from "@solana/web3.js";

export enum RedisKeys {
    INSERT_DATA_BUCKET_LOCK = 'insert_data_bucket_lock:',
    MERGE_TRADE_LOCK = 'merge_trade_lock',
    MERGE_TRADE_CLIP_LOCK = 'merge_trade_clip_lock',
    MERGE_TOKEN_LOCK = 'merge_token_lock',
    MERGE_PF_HASH_LOCK = 'merge_pf_hash_lock_',


}


export enum StoreKeys {
    SYNC_TOKEN_GENERATED_LAST_QUERY_PARAMS = 'sync:token_generated_last_query_params',
    SYNC_TOKEN_LIST_LAST_QUERY_PARAMS = 'sync:token_list_last_query_params',
}


export enum QueueName{
    DIRECT_QUEUE_A = "DIRECT_QUEUE_A",
    DIRECT_QUEUE_B = "DIRECT_QUEUE_B",
    DIRECT_QUEUE_C = "DIRECT_QUEUE_C",
    DIRECT_QUEUE_D = "DIRECT_QUEUE_D",
    DIRECT_QUEUE_POOL_RAYDIUM = "DIRECT_QUEUE_POOL_RAYDIUM",
    DIRECT_QUEUE_POOL_PUMPFUN = "DIRECT_QUEUE_POOL_PUMPFUN",
    DIRECT_QUEUE_LOG = "DIRECT_QUEUE_LOG",
    DIRECT_QUEUE_TX = "DIRECT_QUEUE_TX",
}

export enum BullQueueName{
    SLOT_QUEUE = "SLOT_QUEUE",
    PREFIX = "BULL",
    JOB_ID = "jobId",
    LOG_JOB_ID = "logJobId",
}

export enum BullTaskName{
    SLOT_TASK = "SLOT_TASK",
    LOG_SUBSCRIBE_TASK = "LOG_SUBSCRIBE_TASK"
}

export enum ExchangeName{
    DIRECT_EXCHANGE_A = "DIRECT_EXCHANGE_A",
    //pool变化时放入的exchange
    DIRECT_EXCHANGE_POOL = "DIRECT_EXCHANGE_POOL",
    //处理日志事件的exchange
    DIRECT_EXCHANGE_LOG = "DIRECT_EXCHANGE_LOG",
}

export enum RoutingKey{
    DIRECT_ROUTING_KEY_A = "DIRECT_ROUTING_KEY_A",
    DIRECT_ROUTING_KEY_B = "DIRECT_ROUTING_KEY_B",
    DIRECT_ROUTING_KEY_C = "DIRECT_ROUTING_KEY_C",
    DIRECT_ROUTING_KEY_D = "DIRECT_ROUTING_KEY_D",
    //当pool数据是raydium时绑定到此key
    DIRECT_ROUTING_KEY_POOL_RAYDIUM = "DIRECT_ROUTING_KEY_POOL_RAYDIUM",
    DIRECT_ROUTING_KEY_POOL_PUMPFUN = "DIRECT_ROUTING_KEY_POOL_PUMPFUN",
    DIRECT_ROUTING_KEY_LOG = "DIRECT_ROUTING_KEY_LOG",
    DIRECT_ROUTING_KEY_TX = "DIRECT_ROUTING_KEY_TX",
}

export enum ChannelName{
    CHANNEL_A = "CHANNEL_A",
    CHANNEL_B = "CHANNEL_B"
}

export enum HTTP_METHOD{
    GET = "get",
    POST = "post"
}

export enum ACTIVITY_TYPE {
    ACTIVITY_TOKEN_SWAP = "ACTIVITY_TOKEN_SWAP",
    ACTIVITY_AGG_TOKEN_SWAP = "ACTIVITY_AGG_TOKEN_SWAP",
    ACTIVITY_TOKEN_ADD_LIQ = "ACTIVITY_TOKEN_ADD_LIQ",
    ACTIVITY_TOKEN_REMOVE_LIQ = "ACTIVITY_TOKEN_REMOVE_LIQ",
    ACTIVITY_SPL_TOKEN_STAKE = "ACTIVITY_SPL_TOKEN_STAKE",
    ACTIVITY_SPL_TOKEN_UNSTAKE =  "ACTIVITY_SPL_TOKEN_UNSTAKE",
    ACTIVITY_SPL_TOKEN_WITHDRAW_STAKE = "ACTIVITY_SPL_TOKEN_WITHDRAW_STAKE",
    ACTIVITY_SPL_INIT_MINT = "ACTIVITY_SPL_INIT_MINT"
}

export interface IEventLogMsg{
    log: string;
    txId: string;
}

export interface IEventTXMsg{
    tgId: number;
    txId: string;
    count: number;
}

export enum PROGRAM_LOG_PARAMS{
    PREFIX_OF_LOG = "Program log: ",
    PREFIX_OF_DATA = "Program data: ",
}

export enum SOLANA_NETWORK_ENUM {
    LOCAL_NET = 'local',
    MAIN_NET = 'mainnet',
}
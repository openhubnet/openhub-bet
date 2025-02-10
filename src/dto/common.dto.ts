import { BigNumber } from 'ethers';
import * as BufferLayout from "@solana/buffer-layout";
import { PublicKey } from '@solana/web3.js';

export interface Result<T = any> {
  code: number;
  msg: string;
  data?: any;
}

export const respDefault = (): Result => {
  return {
    code: 0,
    msg: 'Success',
  };
};

export const respFail = (msg: string): Result => {
  return {
    code: 600,
    msg: msg,
  };
};

export const respSuccess = (data?: any): Result => {
  return {
    code: 0,
    msg: 'Success',
    data: data,
  };
};

export interface IChain {
  id: number;
  name: string;
  rpc: string;
  wssRpc: string;
  scan: string;
  usdt: IToken;
}

export interface IToken {
  symbol?: string,
  decimal: number,
  address: string,
}


export interface IEvent {
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  removed: boolean;
  address: string;
  transactionHash: string;
  logIndex: number;
  args: ITransferEventArgs
}

export interface ITransferEventArgs{
  from: string;
  to: string;
  amount: BigNumber;
}

export interface IMsg {
  blockchainType: number;
  blockchainId: number;
  blockNumber: number;
  tokenAddress: string;
  tokenSymbol: string;
  transactionHash: string;
  from: string;
  account: string;
  value: string;
  timestamp: number
}

export enum RedisKeys {
  SUFFIX_OF_LAST_BLOCK_NUMBER = 'last_block_number',
  SUFFIX_OF_LAST_SCAN_NUMBER = 'last_scan_number',
  SUFFIX_OF_SCAN_BLOCK_TIMER= 'scan_block_timer'
}



export class BorshBoolean extends BufferLayout.Layout<boolean> {
  constructor(property?: string) {
    super(1, property);
  }

  decode(b: Buffer, offset = 0): boolean {
    return !!Buffer.from(b.buffer, b.byteOffset, b.length)[offset];
  }
  encode(src: boolean, b: Buffer, offset = 0): number {
    Buffer.from(b.buffer, b.byteOffset, b.length).writeUInt8(src ? 1 : 0, offset);
    return this.span;
  }
}

export class BorshUInt64LE extends BufferLayout.Layout<bigint> {
  constructor(property?: string) {
    super(8, property);
  }

  decode(b: Buffer, offset = 0): bigint {
    return Buffer.from(b.buffer, b.byteOffset, b.length).readBigUInt64LE(offset);
  }
  encode(src: bigint, b: Buffer, offset = 0): number {
    Buffer.from(b.buffer, b.byteOffset, b.length).writeBigUInt64LE(BigInt(src), offset);
    return this.span;
  }
}

export class BorshInt64LE extends BufferLayout.Layout<bigint> {
  constructor(property?: string) {
    super(8, property);
  }

  decode(b: Buffer, offset = 0): bigint {
    return Buffer.from(b.buffer, b.byteOffset, b.length).readBigInt64LE(offset);
  }
  encode(src: bigint, b: Buffer, offset = 0): number {
    Buffer.from(b.buffer, b.byteOffset, b.length).writeBigInt64LE(BigInt(src), offset);
    return this.span;
  }
}

class BorshPublicKey extends BufferLayout.Layout<PublicKey> {
  constructor(property?: string) {
    super(32, property);
  }

  decode(b: Uint8Array, offset?: number): PublicKey {
    offset = offset || 0;
    const span = this.getSpan(b, offset);
    return new PublicKey(
      Buffer.from(b.buffer, b.byteOffset, b.length).subarray(offset, offset + span),
    );
  }

  encode(src: PublicKey, b: Uint8Array, offset?: number): number {
    offset = offset || 0;
    const dstBuf = Buffer.from(b.buffer, b.byteOffset, b.length);
    const srcBuf = src.toBuffer();
    return srcBuf.copy(dstBuf, offset);
  }
}


export type PfTradeEventLayout = {
  mint: PublicKey;
  solAmount: bigint;
  tokenAmount: bigint;
  isBuy: boolean;
  user: PublicKey;
  timestamp: bigint;
  virtualSolReserves: bigint;
  virtualTokenReserves: bigint;
  realSolReserves: bigint;
  realTokenReserves: bigint;
};

export const PfTradeEventLayout = BufferLayout.struct<PfTradeEventLayout>([
  new BorshPublicKey("mint"),
  new BorshUInt64LE("solAmount"),
  new BorshUInt64LE("tokenAmount"),
  new BorshBoolean("isBuy"),
  new BorshPublicKey("user"),
  new BorshInt64LE("timestamp"),
  new BorshUInt64LE("virtualSolReserves"),
  new BorshUInt64LE("virtualTokenReserves"),
  new BorshUInt64LE("realSolReserves"),
  new BorshUInt64LE("realTokenReserves"),
]);

export const PF_PROGRAM_ID = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");

export const PF_LOG_PREFIX = `Program ${PF_PROGRAM_ID.toBase58()}`;
export const PF_LOG_SUCCESS = `${PF_LOG_PREFIX} success`;
export const PF_LOG_DATA_PREFIX = "Program data: ";

export const PF_LOG_TRADE_IDL_DISCRIMINATOR = Uint8Array.from([0xbd, 0xdb, 0x7f, 0xd3, 0x4e, 0xe6, 0x61, 0xee]);
export const PF_LOG_TRADE_DATA_DECODED_LENGTH = PF_LOG_TRADE_IDL_DISCRIMINATOR.byteLength + PfTradeEventLayout.span; // 129
export const PF_LOG_TRADE_DATA_ENCODED_LENGTH = ((4 * (PF_LOG_TRADE_DATA_DECODED_LENGTH / 3)) + 3) & ~3; // 172
export const PF_LOG_TRADE_TOTAL_LENGTH = PF_LOG_DATA_PREFIX.length + PF_LOG_TRADE_DATA_ENCODED_LENGTH; // 186
export const PF_LOG_TRADE_DATA_ENCODED_PREFIX = Buffer.from(PF_LOG_TRADE_IDL_DISCRIMINATOR).toString('base64').slice(0, Math.floor(4 * (PF_LOG_TRADE_IDL_DISCRIMINATOR.byteLength / 3))); // "vdt/007mYe"
export const PF_LOG_TRADE_DATA_ENCODED_PREFIX_OFFSET = PF_LOG_DATA_PREFIX.length; // 14
export const PF_BONDING_CURVE_SEED = Buffer.from("bonding-curve");
export const OPAQUE_SIGNATURE = "1111111111111111111111111111111111111111111111111111111111111111";



export interface EventDbProcessor{
  name: string;
  processEventDb(event: any): Promise<void>;
}

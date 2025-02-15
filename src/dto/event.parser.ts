import { Buffer } from "buffer";
// @ts-ignore
import { Layout } from "buffer-layout";
import { convertIdlToCamelCase, IdlTypeDef } from "@coral-xyz/anchor/dist/cjs/idl";
import pumpIDL from "../config/contract/idl/pump.json";
import {PumpType} from "../config/contract/types/pump";
import { IdlCoder } from "@coral-xyz/anchor/dist/cjs/coder/borsh/idl";
import { PROGRAM_LOG_PARAMS} from "../config/constants";
import { PfTrade } from '../entities/PfTrade';
import { PfCreate } from '../entities/PfCreate';
import { DataBucket } from './DataBucket';
import { PF_LOG_PREFIX, PF_LOG_SUCCESS } from './common.dto';

/**
 * @description event 转换器,负责将筛选,并交给eventDbProcessor处理
 */
export class EventParser {

    private readonly layouts: Map<string, {name:string, layout:Layout}>
  //  private processors: Map<string, EventDbProcessor>;

    constructor() {
        const layouts = new Map<string, {name:string, layout:Layout}>
        const idl = convertIdlToCamelCase(pumpIDL as PumpType);
        if (idl.events) {
            const types: IdlTypeDef[] = idl.types;
            if (!types) {
                throw new Error("Events require `idl.types`");
            }
            idl.events.map((ev) => {
                const typeDef: IdlTypeDef | undefined = types.find((ty) => ty.name === ev.name);
                if (!typeDef) {
                    throw new Error(`Event not found: ${ev.name}`);
                }
                layouts.set(Buffer.from(ev.discriminator).toString('hex'), {name: ev.name, layout: IdlCoder.typeDefLayout({ typeDef, types })});
            });
        }
        this.layouts = layouts;
/*        this.processors = new Map<string, EventDbProcessor>();
        for (let processor of processors) {
            this.processors.set(processor.name, processor);
        }*/
    }

    /**
    *  ...
    *   "Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P invoke [2]",
    *   "Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P consumed 2132 of 67271 compute units",
    *   "Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P success",
    *   "Program data: vdt/007mYe5+k/zb+VDfFZB8Tf9j/bMj5A47lCZGlx9zLqHPzpvc/0NwxgAAAAAAyr/iu1AAAAABZocDR7GJkedJtAl6wYzAQgz27Ei6LD5F5PXhjcbxl7ACdqVnAAAAABLpaRcIAAAA7CtkX25KAwASPUYbAQAAAOyTURPdSwIA",
    *   "Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P consumed 39927 of 102862 compute units",
    *   "Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P success",
    *   "Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P invoke [1]",
    *   ....
    * @param logs
    * @param txId
    * @param blockNumber
    * @param bucket
    */
    dealLogs(logs: string[], txId:string, blockNumber:number, bucket: DataBucket) {
        const logsLength = logs?.length;
        if (!logs || logsLength < 3) {
            return null;
        }
        for (let idx = 1; idx < logsLength; ++idx) {
            if (logs[idx - 1] !== PF_LOG_SUCCESS && (idx !== (logsLength - 1) && !logs[idx + 1].startsWith(PF_LOG_PREFIX))) {
                continue;
            }
            if (logs[idx].startsWith(PROGRAM_LOG_PARAMS.PREFIX_OF_DATA)) {
                const logStr = logs[idx].slice(PROGRAM_LOG_PARAMS.PREFIX_OF_DATA.length);
                //console.log(logStr);
                this.handleLogStr(logStr, txId, blockNumber,bucket);
            }
        }
    }

    handleLogStr(logStr:string, txId:string, blockNumber:number,bucket: DataBucket) {
        const logArr = Buffer.from(logStr, 'base64');
        const eventDiscriminatorHex = logArr.subarray(0, 8).toString("hex")
        const eventLayout = this.layouts.get(eventDiscriminatorHex)
        if(eventLayout){
            const data = eventLayout.layout.decode(logArr.subarray(8))
/*            console.log(eventLayout.name, JSON.stringify(
              Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v !== null && (typeof v === "object" || typeof v === "bigint") ? String(v) : v])),
              null, 2,
            ));*/
            if(eventLayout.name === "tradeEvent"){
                const pft = new PfTrade()
                pft.mint = data.mint.toString()
                pft.solAmount = data.solAmount.toString()
                pft.tokenAmount = data.tokenAmount.toString()
                pft.isBuy = data.isBuy
                pft.userAdr = data.user.toString()
                pft.timestamp = data.timestamp.toString()
                pft.txId = txId
                pft.blockNumber = blockNumber
                pft.status = 0
                bucket.addPfTrade(pft)
                //console.log(pft)
            }else if(eventLayout.name === "createEvent"){
                const pfc = new PfCreate()
                pfc.mint = data.mint.toString()
                pfc.bondingCurve = data.bondingCurve.toString()
                pfc.userAdr = data.user.toString()
                pfc.name = '' //data.name?.replace(/\u0000/g, '')??'';
                pfc.symbol = '' //data.symbol?.replace(/\u0000/g, '')??'';
                pfc.uri = data.uri
                pfc.txId = txId
                pfc.blockNumber = blockNumber
                pfc.status = 0
                bucket.addPfCreate(pfc)
                //console.log(pfc)
            }
        }
    }
}

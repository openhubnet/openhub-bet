import { PfCreate } from '../entities/PfCreate';
import { PfTrade } from '../entities/PfTrade';
import { SolanaSlot } from '../entities/SolanaSlot';

export class DataBucket{

  private readonly pfCreateList: PfCreate[];
  private readonly pfTradeList: PfTrade[];
  private readonly batchSize: 500
  private readonly slotId: number;

  constructor(slotId:number) {
    this.pfCreateList = []
    this.pfTradeList = []
    this.slotId = slotId
  }

  addPfCreate(pfCreate: PfCreate){
    this.pfCreateList.push(pfCreate);
  }

  addPfTrade(pfTrade: PfTrade){
    this.pfTradeList.push(pfTrade);
  }

  getPfCreateList(){
    return this.pfCreateList;
  }

  getPfCreateSpliceList(){
    return this.pfCreateList.splice(0, this.pfCreateList.length > this.batchSize ? this.batchSize : this.pfCreateList.length);
  }

  getPfTradeList(){
    return this.pfTradeList;
  }

  getPfTradeSpliceList(){
    return this.pfTradeList.splice(0, this.pfTradeList.length > this.batchSize ? this.batchSize : this.pfTradeList.length);
  }

  getSlotId(){
    return this.slotId
  }

/*  hasData(){
    return this.pfCreateList.length > 0 || this.pfTradeList.length > 0;
  }*/

  isOverBatchSize(){
    return this.pfCreateList.length > this.batchSize || this.pfTradeList.length > this.batchSize;
  }

}
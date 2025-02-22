/*import { PfCreate } from '../entities/PfCreate';
import { PfTrade } from '../entities/PfTrade';*/

export class DataBucket{

/*  pfCreateList: PfCreate[];
  pfTradeList: PfTrade[];*/
  slotId: number;
  pfHashRecordId: number;
  needUpdateSlot: boolean;
  constructor(slotId:number) {
   // this.pfCreateList = []
   // this.pfTradeList = []
    this.slotId = slotId
  }
/*
  addPfCreate(pfCreate: PfCreate){
    this.pfCreateList.push(pfCreate);
  }

  addPfTrade(pfTrade: PfTrade){
    this.pfTradeList.push(pfTrade);
  }*/

}
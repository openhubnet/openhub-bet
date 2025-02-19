import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { DynamicConfigService } from './dynamic.config.service';
import { ConfigKeys } from '../config/constants';

@Injectable()
export class AxiosService{
  private readonly logger = new Logger(AxiosService.name);
  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
    private dynamicConfigService: DynamicConfigService
  ){
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

  async fetchPumpfunCreate(limit:number,offset:number){
    const config = {
      headers: {
        'X-Dune-API-Key': this.dynamicConfigService.getConfig(ConfigKeys.DUNE_API_TOKEN).val,
        'Content-Type': "application/json"
      }
    }
    const url = this.dynamicConfigService.getConfig(ConfigKeys.FETCH_PUMPFUN_CREATE_API).val+`?limit=${limit}&offset=${offset}`
    return await firstValueFrom(this.httpService.get(url, config))
  }

}
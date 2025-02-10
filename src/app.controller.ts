import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { respDefault, respFail, respSuccess, Result } from './dto/common.dto';
import { ScanService } from './service/scan.service';
import { PfTrade } from './entities/PfTrade';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly scanService: ScanService,
  ) {}

  @Get('/refreshBlockNumber')
  async refreshBlockNumber(): Promise<Result> {
    this.scanService.refreshBlockNumber()
    return respDefault()
  }

  @Get('/sendTask')
  async sendTask(): Promise<Result> {
    this.scanService.sendTask()
    return respDefault()
  }

  @Get('/parseTx')
  async parseTx(@Query('txHash') txHash: string): Promise<Result> {
    this.scanService.parseTx(txHash)
    return respDefault()
  }

  @Get('/parse/block')
  async parseBlock(@Query('slot') slot: string): Promise<Result> {
    await this.scanService.parseBlock(Number(slot))
    return respDefault()
  }

  @Get('/trade/list')
  async tradeList(): Promise<Result> {
    const data = await this.scanService.tradeList()
    return respSuccess(data)
  }

  @Get('/listener/log/start')
  async listenerLogStart(): Promise<Result> {
    const data = await this.scanService.listenerLog()
    return respSuccess(data)
  }

  @Get('/listener/log/end')
  async listenerLogEnd(): Promise<Result> {
    await this.scanService.listenerLogEnd()
    return respSuccess()
  }

  @Post('/trade/add')
  async saveTrade(@Body() trade: PfTrade): Promise<Result> {
    await this.scanService.saveTrade(trade)
    return respSuccess(true);
  }
}

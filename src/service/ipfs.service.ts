import {Injectable, Logger} from "@nestjs/common"
import {HttpService} from "@nestjs/axios"
import {ConfigService} from "@nestjs/config"
import fs from "fs"
import mime from "mime"
import path from "path"

@Injectable()
export class IpfsService{
  private readonly logger = new Logger(IpfsService.name);
  private readonly ipfsApiKey:string
  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ){
    this.ipfsApiKey = this.configService.get("IPFS_API_KEY")
  }

}
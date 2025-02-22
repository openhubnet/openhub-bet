import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Config } from '../entities/Config';
import { Repository } from 'typeorm';


@Injectable()
export class DynamicConfigService implements OnModuleInit{
  private readonly logger = new Logger(DynamicConfigService.name);
  private readonly map: Map<string, Config> = new Map();
  constructor(
    @InjectRepository(Config)
    private readonly configRepository: Repository<Config>,
  ){}

  async refresh(): Promise<void> {
    const resp = await this.configRepository.find();
    resp.forEach((item) => {
        this.map.set(item.key, item);
    })
        // this.logger.log(`refresh dynamic config, keys:${this.map.size}`);
  }

  getConfig(key: string): Config{
    return this.map.get(key);
  }

  onModuleInit(): any {
    this.refresh()
  }

}
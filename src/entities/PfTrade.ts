import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class PfTrade{

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  mint: string;

  @Column({name: 'sol_amount'})
  solAmount: number;

  @Column({name: 'token_amount'})
  tokenAmount: number;

  @Column({ default: true , name: 'is_buy'})
  isBuy: boolean;

  @Column({name: 'user_adr'})
  userAdr: string;

  @Column()
  timestamp: number;

  @Column({name: 'tx_id'})
  txId: string;

  @Column({name: 'block_number'})
  blockNumber: number;

  // 0:数据初始化 1:已统计
  @Column()
  status: number;

  @Column({name: 'create_time'})
    // @CreateDateColumn({ type: "timestamp" })
  createTime: Date;

  @UpdateDateColumn({name: 'update_time', type: "timestamp"})
  updateTime: Date;
}
import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class PfTrade{

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  mint: string;

  @Column({name: 'sol_amount'})
  solAmount: string;

  @Column({name: 'token_amount'})
  tokenAmount: string;

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

  @Column()
  status: number;

  @Column({name: 'create_time'})
    // @CreateDateColumn({ type: "timestamp" })
  createTime: Date;

  @UpdateDateColumn({name: 'update_time', type: "timestamp"})
  updateTime: Date;
}
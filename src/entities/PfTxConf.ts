import { Entity, Column, UpdateDateColumn, PrimaryColumn } from 'typeorm';

@Entity()
export class PfTxConf{

  @PrimaryColumn()
  id: number;

  @Column({name: 'before_tx_id'})
  beforeTxId: string;

  @Column({name: 'before_block_number'})
  beforeBlockNumber: number;

  @Column({name: 'start_block_number'})
  startBlockNumber: number;

  @Column({name: 'end_block_number'})
  endBlockNumber: number;

  @Column()
  status: number;

  @Column({name: 'create_time'})
    // @CreateDateColumn({ type: "timestamp" })
  createTime: Date;

  @UpdateDateColumn({name: 'update_time', type: "timestamp"})
  updateTime: Date;
}
import { Entity, Column, UpdateDateColumn, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class PfTxId{

  @PrimaryGeneratedColumn()
  id: number;

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
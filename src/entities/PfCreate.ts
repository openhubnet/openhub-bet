import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class PfCreate{

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  mint: string;

  @Column({name: 'bonding_curve'})
  bondingCurve: string;

  @Column({name: 'user_adr'})
  userAdr: string;

  @Column()
  name: string;

  @Column()
  symbol: string;

  @Column()
  uri: string;

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
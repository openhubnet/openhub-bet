import { Entity, Column, UpdateDateColumn, PrimaryColumn } from 'typeorm';

@Entity()
export class UserTrade{

  @PrimaryColumn()
  id: number;

  @Column({name: 'user_adr'})
  userAdr: string;

  @Column({name: 'sol_amount'})
  solAmount: number;

  @Column({name: 'token_amount'})
  tokenAmount: number;

  @Column()
  type: number;

  @Column()
  status: number;

  @Column({name: 'create_time'})
    // @CreateDateColumn({ type: "timestamp" })
  createTime: Date;

  @UpdateDateColumn({name: 'update_time', type: "timestamp"})
  updateTime: Date;
}
import { Entity, Column, UpdateDateColumn, PrimaryColumn } from 'typeorm';

@Entity()
export class UserToken{

  @PrimaryColumn()
  id: number;

  @Column({name: 'user_adr'})
  userAdr: string;

  @Column()
  amount: number;

  @Column()
  status: number;

  @Column({name: 'create_time'})
    // @CreateDateColumn({ type: "timestamp" })
  createTime: Date;

  @UpdateDateColumn({name: 'update_time', type: "timestamp"})
  updateTime: Date;
}
import { Entity, Column, UpdateDateColumn, PrimaryColumn } from 'typeorm';

@Entity()
export class SolanaSlot{

  @PrimaryColumn()
  id: number;

  @Column()
  status: number;

  @Column({name: 'create_time'})
    // @CreateDateColumn({ type: "timestamp" })
  createTime: Date;

  @UpdateDateColumn({name: 'update_time', type: "timestamp"})
  updateTime: Date;
}
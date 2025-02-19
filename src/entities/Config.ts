import { Entity, Column, UpdateDateColumn, PrimaryColumn } from 'typeorm';

@Entity()
export class Config{

  @PrimaryColumn()
  id: number;

  @Column()
  key: string;

  @Column()
  val: string;

  @Column({name: 'last_val'})
  lastVal: string;

  @Column()
  status: number;

  @Column({name: 'create_time'})
    // @CreateDateColumn({ type: "timestamp" })
  createTime: Date;

  @UpdateDateColumn({name: 'update_time', type: "timestamp"})
  updateTime: Date;
}
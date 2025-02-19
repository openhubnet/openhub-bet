import { Entity, Column, UpdateDateColumn, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class UserClip{

  @PrimaryGeneratedColumn()
  id: number;

  @Column({name: 'user_adr'})
  userAdr: string;

  @Column()
  status: number;

  @Column({name: 'create_time'})
    // @CreateDateColumn({ type: "timestamp" })
  createTime: Date;

  @UpdateDateColumn({name: 'update_time', type: "timestamp"})
  updateTime: Date;
}
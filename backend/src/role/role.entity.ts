import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum RoleType {
    OWNER = 'owner',
    ADMIN = 'admin',
    MEMBER = 'member',
}

@Entity('roles')
export class Role {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: RoleType,
        default: RoleType.MEMBER,
    })
    name: RoleType;

    @CreateDateColumn()
    createdAt: Date;
}
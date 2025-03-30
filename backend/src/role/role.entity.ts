import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum RoleType {
    OWNER = 'owner',
    ADMIN = 'admin',
    BILLING = 'billing',
}

@Entity('roles')
export class Role {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: RoleType,
        default: RoleType.BILLING,
    })
    name: RoleType;

    @CreateDateColumn()
    createdAt: Date;
}
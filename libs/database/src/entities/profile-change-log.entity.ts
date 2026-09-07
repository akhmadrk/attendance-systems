import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('profile_change_logs')
export class ProfileChangeLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  @Index('IDX_profile_change_logs_user_id')
  userId: string;

  @Column({ type: 'varchar', length: 100, name: 'user_name' })
  userName: string;

  @Column({ type: 'jsonb', name: 'changed_fields' })
  changedFields: Record<string, { old: unknown; new: unknown }>;

  @Column({ type: 'varchar', length: 45, name: 'ip_address' })
  ipAddress: string;

  @Column({ type: 'text', name: 'user_agent' })
  userAgent: string;

  @Column({ type: 'timestamp', default: () => 'now()' })
  @Index('IDX_profile_change_logs_timestamp')
  timestamp: Date;
}

import { EMPLOYEE_PROFILE_UPDATED_EVENT } from '../event-types';

export interface ProfileFieldChange {
  old: unknown;
  new: unknown;
}

export interface ProfileUpdatedEventMetadata {
  ipAddress: string;
  userAgent: string;
}

export interface ProfileUpdatedEvent {
  event: typeof EMPLOYEE_PROFILE_UPDATED_EVENT;
  userId: string;
  userName: string;
  changedFields: Record<string, ProfileFieldChange>;
  metadata: ProfileUpdatedEventMetadata;
  timestamp: string;
}

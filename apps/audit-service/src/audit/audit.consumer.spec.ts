import { ProfileChangeLog } from '@attendance/database';
import {
  EMPLOYEE_PROFILE_UPDATED_EVENT,
  ProfileUpdatedEvent,
} from '@attendance/messaging';
import { Repository } from 'typeorm';
import { ProfileUpdatedConsumer } from './audit.consumer';
import { AuditLogService } from './audit-log.service';

describe('ProfileUpdatedConsumer (integration: event -> audit log -> notification)', () => {
  const gateway = { emitProfileUpdated: jest.fn() };
  const saveMock = jest.fn();
  const createMock = jest.fn((data) => data);

  let consumer: ProfileUpdatedConsumer;

  beforeEach(() => {
    jest.clearAllMocks();
    const repo = {
      save: saveMock,
      create: createMock,
    } as unknown as Repository<ProfileChangeLog>;
    consumer = new ProfileUpdatedConsumer(repo, gateway as never);
  });

  it('persists the audit log with event fields', async () => {
    const event: ProfileUpdatedEvent = {
      event: EMPLOYEE_PROFILE_UPDATED_EVENT,
      userId: 'u1',
      userName: 'John Doe',
      changedFields: {
        phone_number: { old: '+6281', new: '+6282' },
      },
      metadata: { ipAddress: '192.168.1.1', userAgent: 'test-agent' },
      timestamp: '2026-09-07T10:30:00.000Z',
    };

    await consumer.handleProfileUpdated(event);

    expect(createMock).toHaveBeenCalledWith({
      userId: 'u1',
      userName: 'John Doe',
      changedFields: event.changedFields,
      ipAddress: '192.168.1.1',
      userAgent: 'test-agent',
      timestamp: new Date('2026-09-07T10:30:00.000Z'),
    });
    expect(saveMock).toHaveBeenCalled();
    expect(gateway.emitProfileUpdated).toHaveBeenCalledWith(event);
  });
});

describe('AuditLogService (sensitive-field masking)', () => {
  it('masks password-related fields in audit log responses', () => {
    const queryBuilder = {
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([
        [
          {
            id: 'log1',
            userId: 'u1',
            userName: 'John',
            changedFields: {
              password: { old: 'hash1', new: 'hash2' },
              phone_number: { old: '+6281', new: '+6282' },
            },
            ipAddress: '1.2.3.4',
            userAgent: 'ua',
            timestamp: new Date(),
          },
        ],
        1,
      ]),
    };
    const repo = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    } as unknown as Repository<ProfileChangeLog>;

    const service = new AuditLogService(repo);

    return service.list({ page: 1, limit: 10 }).then((result) => {
      expect(result.data[0].changedFields.password).toEqual({
        old: '********',
        new: '********',
      });
      expect(result.data[0].changedFields.phone_number).toEqual({
        old: '+6281',
        new: '+6282',
      });
    });
  });
});

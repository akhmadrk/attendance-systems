import { BadRequestException, ConflictException } from '@nestjs/common';
import { Attendance } from '@attendance/database';
import { Repository } from 'typeorm';
import { AttendanceService } from './attendance.service';

describe('AttendanceService (FR-EMP-007, FR-EMP-008, FR-EMP-009, FR-EMP-010)', () => {
  let service: AttendanceService;
  let findOneMock: jest.Mock;
  let saveMock: jest.Mock;
  let findMock: jest.Mock;
  let executeMock: jest.Mock;

  beforeEach(() => {
    findOneMock = jest.fn();
    saveMock = jest.fn();
    findMock = jest.fn();
    executeMock = jest.fn();

    const queryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: executeMock,
    };
    const repo = {
      findOne: findOneMock,
      create: jest.fn((data) => data),
      save: saveMock,
      find: findMock,
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    } as unknown as Repository<Attendance>;

    service = new AttendanceService(repo);
  });

  describe('clock-in', () => {
    it('creates a record with clock_in for the current Jakarta date', async () => {
      findOneMock.mockResolvedValue(null);
      const now = new Date();
      saveMock.mockImplementation((record) => {
        record.id = 'a1';
        return Promise.resolve(record);
      });

      const result = await service.clockIn('u1');

      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.clockIn).toBe(now.toISOString());
      expect(result.clockOut).toBeNull();
      expect(result.clockInDisplay).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    it('rejects duplicate clock-in without clock-out', async () => {
      findOneMock.mockResolvedValue({ clockOut: null });

      await expect(service.clockIn('u1')).rejects.toThrow(ConflictException);
      expect(saveMock).not.toHaveBeenCalled();
    });

    it('rejects clock-in when attendance already completed', async () => {
      findOneMock.mockResolvedValue({ clockOut: new Date() });

      await expect(service.clockIn('u1')).rejects.toThrow(ConflictException);
    });

    it('maps unique-constraint violation to Conflict', async () => {
      findOneMock.mockResolvedValue(null);
      saveMock.mockRejectedValue({ code: '23505' });

      await expect(service.clockIn('u1')).rejects.toThrow(ConflictException);
    });
  });

  describe('clock-out', () => {
    it('updates clock_out on existing clock-in record', async () => {
      executeMock.mockResolvedValue({ affected: 1 });
      findOneMock.mockResolvedValue({
        id: 'a1',
        userId: 'u1',
        date: '2026-09-07',
        clockIn: new Date('2026-09-07T01:00:00Z'),
        clockOut: new Date('2026-09-07T10:00:00Z'),
      });

      const result = await service.clockOut('u1');

      expect(result.clockOut).not.toBeNull();
      expect(result.clockOutDisplay).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    it('rejects clock-out without prior clock-in', async () => {
      executeMock.mockResolvedValue({ affected: 0 });
      findOneMock.mockResolvedValue(null);

      await expect(service.clockOut('u1')).rejects.toThrow(BadRequestException);
    });

    it('rejects clock-out when already clocked out', async () => {
      executeMock.mockResolvedValue({ affected: 0 });
      findOneMock.mockResolvedValue({
        clockIn: new Date(),
        clockOut: new Date(),
      });

      await expect(service.clockOut('u1')).rejects.toThrow(ConflictException);
    });
  });

  describe('summary', () => {
    it('rejects from date after to date', async () => {
      await expect(
        service.summary('u1', '2026-09-10', '2026-09-01'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects date range exceeding 90 days', async () => {
      await expect(
        service.summary('u1', '2026-01-01', '2026-12-31'),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns records within the given range', async () => {
      findMock.mockResolvedValue([
        {
          id: 'a2',
          userId: 'u1',
          date: '2026-09-07',
          clockIn: new Date('2026-09-07T01:00:00Z'),
          clockOut: new Date('2026-09-07T10:00:00Z'),
        },
      ]);

      const result = await service.summary('u1', '2026-09-01', '2026-09-07');

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2026-09-07');
      expect(findMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'u1' }),
        }),
      );
    });
  });
});

import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserRole, UserStatus } from '@attendance/common';
import { User } from '@attendance/database';
import { Repository } from 'typeorm';
import { AdminEmployeeService } from './admin-employee.service';

describe('AdminEmployeeService (FR-HRD-001, FR-HRD-002, FR-HRD-003)', () => {
  let service: AdminEmployeeService;
  let findOneMock: jest.Mock;
  let findAndCountMock: jest.Mock;
  let saveMock: jest.Mock;
  let updateMock: jest.Mock;
  let createMock: jest.Mock;

  beforeEach(() => {
    findOneMock = jest.fn();
    findAndCountMock = jest.fn();
    saveMock = jest.fn();
    updateMock = jest.fn();
    createMock = jest.fn((data) => data);

    const repo = {
      findOne: findOneMock,
      findAndCount: findAndCountMock,
      save: saveMock,
      update: updateMock,
      create: createMock,
    } as unknown as Repository<User>;

    service = new AdminEmployeeService(repo);
  });

  describe('create', () => {
    it('rejects duplicate email with Conflict', async () => {
      findOneMock.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({
          name: 'Jane',
          email: 'jane@company.com',
          position: 'Engineer',
          password: 'SecurePass123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates employee with EMPLOYEE role and ACTIVE status', async () => {
      findOneMock.mockResolvedValue(null);
      saveMock.mockResolvedValue({
        id: 'new-id',
        name: 'Jane',
        email: 'jane@company.com',
        position: 'Engineer',
        phoneNumber: null,
        photoUrl: null,
        role: UserRole.EMPLOYEE,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
      });

      const result = await service.create({
        name: 'Jane',
        email: 'jane@company.com',
        position: 'Engineer',
        password: 'SecurePass123',
      });

      expect(result.role).toBe(UserRole.EMPLOYEE);
      expect(result.status).toBe(UserStatus.ACTIVE);
      expect(saveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          password: expect.not.stringContaining('SecurePass123'),
        }),
      );
    });
  });

  describe('update', () => {
    it('throws NotFound for missing employee', async () => {
      findOneMock.mockResolvedValue(null);

      await expect(service.update('missing', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects email collision with Conflict', async () => {
      findOneMock
        .mockResolvedValueOnce({ id: 'u1', email: 'old@company.com' })
        .mockResolvedValueOnce({ id: 'u2', email: 'taken@company.com' });

      await expect(
        service.update('u1', { email: 'taken@company.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deactivate', () => {
    it('sets status to INACTIVE', async () => {
      findOneMock.mockResolvedValue({ id: 'u1' });

      await service.deactivate('u1');

      expect(updateMock).toHaveBeenCalledWith('u1', {
        status: UserStatus.INACTIVE,
      });
    });

    it('throws NotFound for missing employee', async () => {
      findOneMock.mockResolvedValue(null);

      await expect(service.deactivate('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

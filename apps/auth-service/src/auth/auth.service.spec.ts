import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@attendance/database';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';

describe('AuthService (FR-EMP-001, FR-EMP-002)', () => {
  let service: AuthService;
  let updateMock: jest.Mock;
  let getOneMock: jest.Mock;
  let signAsyncMock: jest.Mock;
  let verifyAsyncMock: jest.Mock;

  const configGet = (key: string): string | undefined =>
    ({
      JWT_SECRET: 'access-secret',
      JWT_REFRESH_SECRET: 'refresh-secret',
      JWT_EXPIRES_IN: '1h',
      JWT_REFRESH_EXPIRES_IN: '7d',
    })[key];

  beforeEach(() => {
    updateMock = jest.fn().mockResolvedValue({ affected: 1 });
    getOneMock = jest.fn().mockResolvedValue(null);
    signAsyncMock = jest.fn();
    verifyAsyncMock = jest.fn();

    const queryBuilder = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: getOneMock,
    };
    const userRepo = {
      update: updateMock,
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    } as unknown as Repository<User>;
    const jwtService = {
      signAsync: signAsyncMock,
      verifyAsync: verifyAsyncMock,
    } as unknown as JwtService;
    const config = { get: configGet } as unknown as ConfigService;

    service = new AuthService(userRepo, jwtService, config);
  });

  describe('login', () => {
    it('returns tokens and safe user on valid credentials', async () => {
      const password = await bcrypt.hash('Admin123!', 10);
      getOneMock.mockResolvedValue({
        id: 'u1',
        name: 'John Doe',
        email: 'john@company.com',
        role: 'EMPLOYEE',
        photoUrl: null,
        password,
        failedLoginAttempts: 0,
        lockedUntil: null,
      });
      signAsyncMock
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login({
        email: 'john@company.com',
        password: 'Admin123!',
      });

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user).toEqual({
        id: 'u1',
        name: 'John Doe',
        email: 'john@company.com',
        role: 'EMPLOYEE',
        photoUrl: null,
      });
      expect(updateMock).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({ failedLoginAttempts: 0, lockedUntil: null }),
      );
    });

    it('throws Unauthorized on wrong password and increments attempts', async () => {
      getOneMock.mockResolvedValue({
        id: 'u1',
        name: 'John Doe',
        email: 'john@company.com',
        role: 'EMPLOYEE',
        photoUrl: null,
        password: await bcrypt.hash('correct-password', 10),
        failedLoginAttempts: 0,
        lockedUntil: null,
      });

      await expect(
        service.login({ email: 'john@company.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(updateMock).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({ failedLoginAttempts: 1 }),
      );
    });

    it('throws Unauthorized when account is locked', async () => {
      getOneMock.mockResolvedValue({
        id: 'u1',
        name: 'John Doe',
        email: 'john@company.com',
        role: 'EMPLOYEE',
        photoUrl: null,
        password: 'irrelevant',
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 60_000),
      });

      await expect(
        service.login({ email: 'john@company.com', password: 'Admin123!' }),
      ).rejects.toThrow(/Account locked/);
    });

    it('throws Unauthorized when account is inactive', async () => {
      getOneMock.mockResolvedValue({
        id: 'u1',
        name: 'John Doe',
        email: 'john@company.com',
        role: 'EMPLOYEE',
        photoUrl: null,
        password: 'hashed',
        status: 'INACTIVE',
        failedLoginAttempts: 0,
        lockedUntil: null,
      });

      await expect(
        service.login({ email: 'john@company.com', password: 'Admin123!' }),
      ).rejects.toThrow(/inactive/);
    });
  });

  describe('refresh', () => {
    it('rotates tokens on valid refresh token', async () => {
      const refreshToken = 'existing-refresh-token';
      verifyAsyncMock.mockResolvedValue({ sub: 'u1', type: 'refresh' });
      getOneMock.mockResolvedValue({
        id: 'u1',
        name: 'John Doe',
        email: 'john@company.com',
        role: 'EMPLOYEE',
        photoUrl: null,
        refreshToken: await bcrypt.hash(refreshToken, 10),
      });
      signAsyncMock
        .mockResolvedValueOnce('new-access')
        .mockResolvedValueOnce('new-refresh');

      const result = await service.refresh({ refreshToken });

      expect(result.accessToken).toBe('new-access');
      expect(result.refreshToken).toBe('new-refresh');
    });

    it('throws Unauthorized on invalid refresh token signature', async () => {
      verifyAsyncMock.mockRejectedValue(new Error('invalid'));

      await expect(
        service.refresh({ refreshToken: 'bad-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('clears the stored refresh token', async () => {
      await service.logout('u1');
      expect(updateMock).toHaveBeenCalledWith('u1', { refreshToken: null });
    });
  });
});

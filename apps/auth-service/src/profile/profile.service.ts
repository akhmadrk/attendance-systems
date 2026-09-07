import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AUTH, detectImageType, UserRole } from '@attendance/common';
import { User } from '@attendance/database';
import {
  EMPLOYEE_PROFILE_UPDATED_EVENT,
  ProfileEventPublisher,
} from '@attendance/messaging';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import { Repository } from 'typeorm';
import { UpdateProfileDto } from './dto/update-profile.dto';

export interface ProfileResponse {
  id: string;
  name: string;
  email: string;
  position: string;
  phoneNumber: string | null;
  photoUrl: string | null;
  role: UserRole;
}

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly publisher: ProfileEventPublisher,
  ) {}

  async getProfile(userId: string): Promise<ProfileResponse> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toProfile(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    file: Express.Multer.File | undefined,
    ip: string,
    userAgent: string,
  ): Promise<ProfileResponse> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const changedFields: Record<string, { old: unknown; new: unknown }> = {};

    if (dto.phoneNumber !== undefined && dto.phoneNumber !== user.phoneNumber) {
      changedFields.phone_number = {
        old: user.phoneNumber,
        new: dto.phoneNumber,
      };
      user.phoneNumber = dto.phoneNumber;
    }

    if (file) {
      await this.validateImageFile(file);
      const photoUrl = `/uploads/photos/${file.filename}`;
      changedFields.photo_url = { old: user.photoUrl, new: photoUrl };
      user.photoUrl = photoUrl;
    }

    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException(
          'Current password is required to change password',
        );
      }
      const userWithPassword = await this.userRepo
        .createQueryBuilder('user')
        .addSelect('user.password')
        .where('user.id = :id', { id: userId })
        .getOne();

      const valid = await bcrypt.compare(
        dto.currentPassword,
        userWithPassword?.password ?? '',
      );
      if (!valid) {
        throw new BadRequestException('Current password is incorrect');
      }
      user.password = await bcrypt.hash(dto.newPassword, AUTH.BCRYPT_SALT_ROUNDS);
      changedFields.password = { old: '********', new: '********' };
    }

    await this.userRepo.save(user);

    if (Object.keys(changedFields).length > 0) {
      this.publisher.publishProfileUpdated({
        event: EMPLOYEE_PROFILE_UPDATED_EVENT,
        userId: user.id,
        userName: user.name,
        changedFields,
        metadata: { ipAddress: ip, userAgent },
        timestamp: new Date().toISOString(),
      });
    }

    return this.toProfile(user);
  }

  private async validateImageFile(file: Express.Multer.File): Promise<void> {
    const buffer = await fs.promises.readFile(file.path);
    const type = detectImageType(buffer);
    if (!type) {
      await fs.promises.unlink(file.path).catch(() => undefined);
      throw new BadRequestException(
        'Invalid image content. Allowed: JPG, PNG, WEBP',
      );
    }
  }

  private toProfile(user: User): ProfileResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      position: user.position,
      phoneNumber: user.phoneNumber,
      photoUrl: user.photoUrl,
      role: user.role,
    };
  }
}

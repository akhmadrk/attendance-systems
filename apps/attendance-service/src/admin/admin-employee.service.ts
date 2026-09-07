import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AUTH,
  PAGINATION,
  UserRole,
  UserStatus,
} from '@attendance/common';
import { User } from '@attendance/database';
import * as bcrypt from 'bcrypt';
import { ILike, Repository } from 'typeorm';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

export interface EmployeeResponse {
  id: string;
  name: string;
  email: string;
  position: string;
  phoneNumber: string | null;
  photoUrl: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
}

@Injectable()
export class AdminEmployeeService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async list(
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
    search?: string,
  ): Promise<{ data: EmployeeResponse[]; total: number; page: number; limit: number }> {
    const where = search
      ? [
          { name: ILike(`%${search}%`) },
          { email: ILike(`%${search}%`) },
          { position: ILike(`%${search}%`) },
        ]
      : undefined;

    const [users, total] = await this.userRepo.findAndCount({
      where,
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: users.map((user) => this.toResponse(user)),
      total,
      page,
      limit,
    };
  }

  async create(dto: CreateEmployeeDto): Promise<EmployeeResponse> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      position: dto.position,
      password: await bcrypt.hash(dto.password, AUTH.BCRYPT_SALT_ROUNDS),
      phoneNumber: dto.phoneNumber ?? null,
      photoUrl: null,
      role: UserRole.EMPLOYEE,
      status: UserStatus.ACTIVE,
    });

    const saved = await this.userRepo.save(user);
    return this.toResponse(saved);
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<EmployeeResponse> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Employee not found');
    }

    if (dto.email && dto.email !== user.email) {
      const duplicate = await this.userRepo.findOne({
        where: { email: dto.email },
      });
      if (duplicate) {
        throw new ConflictException('Email already in use');
      }
      user.email = dto.email;
    }

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.position !== undefined) user.position = dto.position;
    if (dto.phoneNumber !== undefined) user.phoneNumber = dto.phoneNumber;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.status !== undefined) user.status = dto.status;
    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, AUTH.BCRYPT_SALT_ROUNDS);
    }

    const saved = await this.userRepo.save(user);
    return this.toResponse(saved);
  }

  async deactivate(id: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Employee not found');
    }
    await this.userRepo.update(id, { status: UserStatus.INACTIVE });
  }

  private toResponse(user: User): EmployeeResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      position: user.position,
      phoneNumber: user.phoneNumber,
      photoUrl: user.photoUrl,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    };
  }
}

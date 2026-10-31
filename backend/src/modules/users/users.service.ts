import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';

const PUBLIC_USER_FIELDS = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  subscriptionStatus: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /** Accounts provisioned by an admin (internal team) skip e-mail verification and billing. */
  async create(createUserDto: CreateUserDto) {
    const email = createUserDto.email.trim().toLowerCase();
    if (await this.findByEmail(email)) {
      throw new ConflictException('Já existe um usuário com este e-mail');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: createUserDto.fullName,
        role: createUserDto.role || 'MANAGER',
        authProvider: 'LOCAL',
        emailVerified: true,
        subscriptionStatus: 'ACTIVE',
      },
      select: PUBLIC_USER_FIELDS,
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: PUBLIC_USER_FIELDS,
      orderBy: { createdAt: 'asc' },
    });
  }

  async setPassword(id: string, password: string) {
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: await bcrypt.hash(password, 10) },
    });
  }
}

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { QueryFailedError, Repository } from 'typeorm';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    }); // La contraseña texto plano se vuelve hash
    const user = this.usersRepository.create({
      email,
      passwordHash,
      username: dto.username ?? null,
    });

    try {
      const savedUser = await this.usersRepository.save(user);
      return {
        id: savedUser.id,
        email: savedUser.email,
        username: savedUser.username ?? null,
        isActive: savedUser.isActive,
        createdAt: savedUser.createdAt,
      };
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const matches = await argon2.verify(user.passwordHash, dto.password);
    if (!matches) {
      throw new UnauthorizedException('Invalid password credentials');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
    });
    return { access_token: accessToken };
  }

  // Devuelve solo los campos públicos del usuario (nunca el hash).
  private toSafeUser(user: UserEntity) {
    return {
      id: user.id,
      email: user.email,
      waid: user.waid,
      phone: user.phone,
      username: user.username ?? null,
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      (error.driverError as { code?: string }).code === '23505'
    );
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.usersRepository.findOneBy({ id: userId });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found');
    }

    if (dto.email !== undefined) {
      const email = dto.email.toLowerCase();

      if (email !== user.email) {
        const existing = await this.usersRepository.findOne({
          where: { email },
        });

        if (existing && existing.id !== user.id) {
          throw new ConflictException('Email already registered');
        }

        user.email = email;
      }
    }

    if (dto.username !== undefined) {
      const username = dto.username.trim();
      user.username = username.length > 0 ? username : null;
    }

    if (dto.phone !== undefined) {
      const phone = dto.phone.trim();
      user.phone = phone.length > 0 ? phone : null;
    }

    try {
      const saved = await this.usersRepository.save(user);
      return this.toSafeUser(saved);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: { id: true, passwordHash: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found');
    }

    const matches = await argon2.verify(user.passwordHash, dto.currentPassword);

    if (!matches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.passwordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
    });

    await this.usersRepository.save(user);

    return { message: 'Password updated' };
  }
}

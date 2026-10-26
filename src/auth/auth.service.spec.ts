import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { UserEntity } from './entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;

  const repositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const jwtServiceMock = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: repositoryMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('registers a user and returns it without the password', async () => {
    const createdAt = new Date();
    const built = { email: 'luis@example.com' } as UserEntity;
    const saved = {
      id: 'user-1',
      email: 'luis@example.com',
      passwordHash: 'hash',
      isActive: true,
      createdAt,
    } as UserEntity;

    repositoryMock.create.mockReturnValue(built);
    repositoryMock.save.mockResolvedValue(saved);

    const result = await service.register({
      email: 'Luis@Example.com',
      password: 'Secret123',
    });

    expect(repositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'luis@example.com' }),
    );
    expect(repositoryMock.save).toHaveBeenCalledWith(built);
    expect(result).toEqual({
      id: 'user-1',
      email: 'luis@example.com',
      isActive: true,
      createdAt,
    });
  });

  it('throws UnauthorizedException when the user does not exist', async () => {
    repositoryMock.findOne.mockResolvedValue(null);

    await expect(
      service.login({ email: 'nobody@example.com', password: 'Secret123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when the user is inactive', async () => {
    const user = {
      id: 'user-1',
      email: 'luis@example.com',
      passwordHash: 'hash',
      isActive: false,
    } as UserEntity;

    repositoryMock.findOne.mockResolvedValue(user);

    await expect(
      service.login({ email: 'luis@example.com', password: 'Secret123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
  });
});

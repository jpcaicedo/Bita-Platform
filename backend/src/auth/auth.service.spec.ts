import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { UserEntity } from './entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;

  const repositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
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
      username: 'LuisF',
      passwordHash: 'hash',
      isActive: true,
      createdAt,
    } as UserEntity;

    repositoryMock.create.mockReturnValue(built);
    repositoryMock.save.mockResolvedValue(saved);

    const result = await service.register({
      email: 'Luis@Example.com',
      password: 'Secret123',
      username: 'LuisF',
    });

    expect(repositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'luis@example.com',
        username: 'LuisF',
      }),
    );
    expect(repositoryMock.save).toHaveBeenCalledWith(built);
    expect(result).toEqual({
      id: 'user-1',
      email: 'luis@example.com',
      username: 'LuisF',
      isActive: true,
      createdAt,
    });
  });

  it('registers a user without username and returns null', async () => {
    const createdAt = new Date();
    const built = { email: 'luis@example.com' } as UserEntity;
    const saved = {
      id: 'user-2',
      email: 'luis@example.com',
      username: null,
      passwordHash: 'hash',
      isActive: true,
      createdAt,
    } as UserEntity;

    repositoryMock.create.mockReturnValue(built);
    repositoryMock.save.mockResolvedValue(saved);

    const result = await service.register({
      email: 'luis@example.com',
      password: 'Secret123',
    });

    expect(repositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ username: null }),
    );
    expect(result.username).toBeNull();
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

  it('updates the profile, trims values and clears empty fields', async () => {
    const user = {
      id: 'user-1',
      email: 'luis@example.com',
      username: 'LuisF',
      phone: null,
      waid: null,
      isActive: true,
    } as UserEntity;

    repositoryMock.findOneBy.mockResolvedValue(user);
    repositoryMock.save.mockImplementation((value: UserEntity) =>
      Promise.resolve(value),
    );

    const result = await service.updateProfile('user-1', {
      username: '  Luis Franco  ',
      phone: '   ',
    });

    expect(result).toEqual({
      id: 'user-1',
      email: 'luis@example.com',
      waid: null,
      phone: null,
      username: 'Luis Franco',
    });
    expect(repositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'Luis Franco', phone: null }),
    );
  });

  it('lowercases the email when it changes', async () => {
    const user = {
      id: 'user-1',
      email: 'luis@example.com',
      username: 'LuisF',
      phone: null,
      waid: null,
      isActive: true,
    } as UserEntity;

    repositoryMock.findOneBy.mockResolvedValue(user);
    repositoryMock.findOne.mockResolvedValue(null);
    repositoryMock.save.mockImplementation((value: UserEntity) =>
      Promise.resolve(value),
    );

    const result = await service.updateProfile('user-1', {
      email: 'Nuevo@Example.com',
    });

    expect(result.email).toBe('nuevo@example.com');
  });

  it('rejects an email already used by another account', async () => {
    repositoryMock.findOneBy.mockResolvedValue({
      id: 'user-1',
      email: 'luis@example.com',
      isActive: true,
    });
    repositoryMock.findOne.mockResolvedValue({
      id: 'user-2',
      email: 'otro@example.com',
    });

    await expect(
      service.updateProfile('user-1', { email: 'otro@example.com' }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repositoryMock.save).not.toHaveBeenCalled();
  });

  it('rejects the profile update when the user does not exist', async () => {
    repositoryMock.findOneBy.mockResolvedValue(null);

    await expect(
      service.updateProfile('missing', { username: 'Nadie' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('changes the password after verifying the current one', async () => {
    const passwordHash = await argon2.hash('Secret123', {
      type: argon2.argon2id,
    });
    const user = {
      id: 'user-1',
      passwordHash,
      isActive: true,
    } as UserEntity;

    repositoryMock.findOne.mockResolvedValue(user);
    repositoryMock.save.mockImplementation((value: UserEntity) =>
      Promise.resolve(value),
    );

    const result = await service.changePassword('user-1', {
      currentPassword: 'Secret123',
      newPassword: 'Nueva1234',
    });

    expect(result).toEqual({ message: 'Password updated' });
    await expect(argon2.verify(user.passwordHash, 'Nueva1234')).resolves.toBe(
      true,
    );
  });

  it('rejects a password change when the current password is wrong', async () => {
    const passwordHash = await argon2.hash('Secret123', {
      type: argon2.argon2id,
    });
    const user = {
      id: 'user-1',
      passwordHash,
      isActive: true,
    } as UserEntity;

    repositoryMock.findOne.mockResolvedValue(user);

    await expect(
      service.changePassword('user-1', {
        currentPassword: 'Incorrecta',
        newPassword: 'Nueva1234',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(repositoryMock.save).not.toHaveBeenCalled();
  });
});

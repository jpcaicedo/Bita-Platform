import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthorizationsService } from '../authorizations/authorizations.service';
import { VehicleEntity } from '../vehicles/entities/vehicle.entity';
import { VehiclesService } from '../vehicles/vehicles.service';
import { WorkshopProfileEntity } from './entities/workshop-profile.entity';
import { WorkshopsService } from './workshops.service';

describe('WorkshopsService', () => {
  let service: WorkshopsService;

  const repositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    existsBy: jest.fn(),
    merge: jest.fn(),
  };

  const vehiclesServiceMock = {
    findByPlate: jest.fn(),
  };

  const authorizationsServiceMock = {
    findActive: jest.fn(),
    findActiveByWorkshop: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        WorkshopsService,
        {
          provide: getRepositoryToken(WorkshopProfileEntity),
          useValue: repositoryMock,
        },
        {
          provide: VehiclesService,
          useValue: vehiclesServiceMock,
        },
        {
          provide: AuthorizationsService,
          useValue: authorizationsServiceMock,
        },
      ],
    }).compile();

    service = moduleRef.get(WorkshopsService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a workshop profile for the user', async () => {
    const built = {
      userId: 'user-1',
      name: 'Taller Cali',
    } as WorkshopProfileEntity;
    const saved = {
      ...built,
      id: 'profile-1',
    } as WorkshopProfileEntity;

    repositoryMock.existsBy.mockResolvedValue(false);
    repositoryMock.create.mockReturnValue(built);
    repositoryMock.save.mockResolvedValue(saved);

    const result = await service.create('user-1', { name: 'Taller Cali' });

    expect(repositoryMock.create).toHaveBeenCalledWith({
      userId: 'user-1',
      name: 'Taller Cali',
      businessName: null,
      identification: null,
    });
    expect(repositoryMock.save).toHaveBeenCalledWith(built);
    expect(result).toEqual(saved);
  });

  it('does not create a second workshop profile for the same user', async () => {
    repositoryMock.existsBy.mockResolvedValue(true);

    await expect(
      service.create('user-1', { name: 'Taller Cali' }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repositoryMock.save).not.toHaveBeenCalled();
  });

  it('returns the workshop profile of a user', async () => {
    const profile = {
      id: 'profile-1',
      userId: 'user-1',
    } as WorkshopProfileEntity;

    repositoryMock.findOneBy.mockResolvedValue(profile);

    const result = await service.findByUser('user-1');

    expect(result).toEqual(profile);
    expect(repositoryMock.findOneBy).toHaveBeenCalledWith({ userId: 'user-1' });
  });

  it('throws NotFoundException when the user has no workshop profile', async () => {
    repositoryMock.findOneBy.mockResolvedValue(null);

    await expect(service.findByUser('user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates the workshop profile and saves it', async () => {
    const profile = {
      id: 'profile-1',
      userId: 'user-1',
    } as WorkshopProfileEntity;
    const saved = { ...profile, name: 'Nuevo nombre' } as WorkshopProfileEntity;

    repositoryMock.findOneBy.mockResolvedValue(profile);
    repositoryMock.save.mockResolvedValue(saved);

    const result = await service.update('user-1', { name: 'Nuevo nombre' });

    expect(repositoryMock.merge).toHaveBeenCalledWith(profile, {
      name: 'Nuevo nombre',
    });
    expect(repositoryMock.save).toHaveBeenCalledWith(profile);
    expect(result).toEqual(saved);
  });

  it('throws ForbiddenException when the user is not a workshop', async () => {
    repositoryMock.existsBy.mockResolvedValue(false);

    await expect(service.ensureIsWorkshop('user-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('throws NotFoundException when the workshop does not exist', async () => {
    repositoryMock.existsBy.mockResolvedValue(false);

    await expect(service.ensureWorkshopExists('user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lists the authorized vehicles and hides kilometers without read permission', async () => {
    const authorizations = [
      {
        id: 'auth-1',
        canRead: true,
        canWrite: false,
        vehicle: {
          id: 'vehicle-1',
          plate: 'ABC123',
          brand: 'Mazda',
          model: '3',
          year: 2020,
          currentKilometers: 10000,
        },
      },
      {
        id: 'auth-2',
        canRead: false,
        canWrite: false,
        vehicle: {
          id: 'vehicle-2',
          plate: 'XYZ789',
          brand: 'Kia',
          model: 'Rio',
          year: 2019,
          currentKilometers: 20000,
        },
      },
    ];

    repositoryMock.existsBy.mockResolvedValue(true);
    authorizationsServiceMock.findActiveByWorkshop.mockResolvedValue(
      authorizations,
    );

    const result = await service.findAuthorizedVehicles('workshop-1');

    expect(result.length).toBe(2);
    expect(result[0].vehicle.currentKilometers).toBe(10000);
    expect(result[1].vehicle.currentKilometers).toBe(null);
    expect(authorizationsServiceMock.findActiveByWorkshop).toHaveBeenCalledWith(
      'workshop-1',
    );
  });

  it('does not list vehicles for a user that is not a workshop', async () => {
    repositoryMock.existsBy.mockResolvedValue(false);

    await expect(
      service.findAuthorizedVehicles('user-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(
      authorizationsServiceMock.findActiveByWorkshop,
    ).not.toHaveBeenCalled();
  });

  it('finds a vehicle by plate with its kilometers when the workshop can read', async () => {
    const vehicle = {
      id: 'vehicle-1',
      plate: 'ABC123',
      brand: 'Mazda',
      model: '3',
      year: 2020,
      currentKilometers: 10000,
    } as VehicleEntity;
    const authorization = {
      id: 'auth-1',
      canRead: true,
      canWrite: true,
      status: 'active',
    };

    repositoryMock.existsBy.mockResolvedValue(true);
    vehiclesServiceMock.findByPlate.mockResolvedValue(vehicle);
    authorizationsServiceMock.findActive.mockResolvedValue(authorization);

    const result = await service.findVehicleByPlate('ABC123', 'workshop-1');

    expect(result.vehicle.currentKilometers).toBe(10000);
    expect(result.authorization).toEqual({
      id: 'auth-1',
      canRead: true,
      canWrite: true,
      status: 'active',
    });
    expect(authorizationsServiceMock.findActive).toHaveBeenCalledWith(
      'vehicle-1',
      'workshop-1',
    );
  });

  it('hides the kilometers and the authorization when the workshop has none', async () => {
    const vehicle = {
      id: 'vehicle-1',
      plate: 'ABC123',
      brand: 'Mazda',
      model: '3',
      year: 2020,
      currentKilometers: 10000,
    } as VehicleEntity;

    repositoryMock.existsBy.mockResolvedValue(true);
    vehiclesServiceMock.findByPlate.mockResolvedValue(vehicle);
    authorizationsServiceMock.findActive.mockResolvedValue(null);

    const result = await service.findVehicleByPlate('ABC123', 'workshop-1');

    expect(result.vehicle.currentKilometers).toBe(null);
    expect(result.authorization).toBe(null);
  });
});

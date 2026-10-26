import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { VehicleEntity } from '../vehicles/entities/vehicle.entity';
import { VehiclesService } from '../vehicles/vehicles.service';
import { WorkshopProfileEntity } from '../workshops/entities/workshop-profile.entity';
import { AuthorizationRulesService } from './authorization-rules.service';
import { AuthorizationsService } from './authorizations.service';
import { WorkshopAuthorizationEntity } from './entities/workshop-authorization.entity';

describe('AuthorizationsService', () => {
  let service: AuthorizationsService;

  const owner: AuthenticatedUser = {
    id: 'owner-1',
    email: 'owner@example.com',
    waid: null,
    phone: null,
  };

  const authorizationsRepositoryMock = {
    create: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
    manager: {
      transaction: jest.fn(),
    },
  };

  const workshopProfilesRepositoryMock = {
    existsBy: jest.fn(),
  };

  const vehiclesServiceMock = {
    findOwnedOrFail: jest.fn(),
    findOne: jest.fn(),
  };

  const authorizationRulesServiceMock = {
    ensureValidPermissions: jest.fn(),
    ensureWorkshopIsNotOwner: jest.fn(),
    ensureCanBeRevoked: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthorizationsService,
        {
          provide: getRepositoryToken(WorkshopAuthorizationEntity),
          useValue: authorizationsRepositoryMock,
        },
        {
          provide: getRepositoryToken(WorkshopProfileEntity),
          useValue: workshopProfilesRepositoryMock,
        },
        {
          provide: VehiclesService,
          useValue: vehiclesServiceMock,
        },
        {
          provide: AuthorizationRulesService,
          useValue: authorizationRulesServiceMock,
        },
      ],
    }).compile();

    service = moduleRef.get(AuthorizationsService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('throws NotFoundException when the workshop does not exist', async () => {
    const vehicle = { id: 'vehicle-1', ownerId: 'owner-1' } as VehicleEntity;

    vehiclesServiceMock.findOwnedOrFail.mockResolvedValue(vehicle);
    workshopProfilesRepositoryMock.existsBy.mockResolvedValue(false);

    await expect(
      service.grant('vehicle-1', owner, { workshopId: 'workshop-1' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(
      authorizationsRepositoryMock.manager.transaction,
    ).not.toHaveBeenCalled();
  });

  it('does not grant when the user is not the owner of the vehicle', async () => {
    vehiclesServiceMock.findOwnedOrFail.mockImplementation(() => {
      throw new ForbiddenException('You are not the owner of this vehicle');
    });

    await expect(
      service.grant('vehicle-1', owner, { workshopId: 'workshop-1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(
      authorizationsRepositoryMock.manager.transaction,
    ).not.toHaveBeenCalled();
  });

  it('does not grant when the permissions rule rejects the request', async () => {
    const vehicle = { id: 'vehicle-1', ownerId: 'owner-1' } as VehicleEntity;

    vehiclesServiceMock.findOwnedOrFail.mockResolvedValue(vehicle);
    authorizationRulesServiceMock.ensureValidPermissions.mockImplementation(
      () => {
        throw new BadRequestException(
          'Write permission requires read permission',
        );
      },
    );

    await expect(
      service.grant('vehicle-1', owner, {
        workshopId: 'workshop-1',
        canRead: false,
        canWrite: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(
      authorizationsRepositoryMock.manager.transaction,
    ).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the authorization to revoke does not exist', async () => {
    authorizationsRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.revoke('missing', owner, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('does not revoke when the user is not the owner of the vehicle', async () => {
    const authorization = {
      id: 'auth-1',
      status: 'active',
      vehicle: { ownerId: 'another-owner' },
    } as WorkshopAuthorizationEntity;

    authorizationsRepositoryMock.findOne.mockResolvedValue(authorization);

    await expect(service.revoke('auth-1', owner, {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(
      authorizationsRepositoryMock.manager.transaction,
    ).not.toHaveBeenCalled();
  });

  it('does not revoke when the rule rejects the change', async () => {
    const authorization = {
      id: 'auth-1',
      status: 'revoked',
      vehicle: { ownerId: 'owner-1' },
    } as WorkshopAuthorizationEntity;

    authorizationsRepositoryMock.findOne.mockResolvedValue(authorization);
    authorizationRulesServiceMock.ensureCanBeRevoked.mockImplementation(() => {
      throw new ConflictException('Authorization is already revoked');
    });

    await expect(service.revoke('auth-1', owner, {})).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(
      authorizationsRepositoryMock.manager.transaction,
    ).not.toHaveBeenCalled();
  });

  it('returns the authorizations of a vehicle owned by the user', async () => {
    const authorizations = [
      { id: 'auth-1', vehicleId: 'vehicle-1' },
    ] as WorkshopAuthorizationEntity[];

    vehiclesServiceMock.findOwnedOrFail.mockResolvedValue({} as VehicleEntity);
    authorizationsRepositoryMock.find.mockResolvedValue(authorizations);

    const result = await service.findByVehicle('vehicle-1', 'owner-1');

    expect(result).toEqual(authorizations);
    expect(authorizationsRepositoryMock.find).toHaveBeenCalledWith({
      where: { vehicleId: 'vehicle-1' },
    });
  });

  it('throws ForbiddenException when the workshop has no active authorization', async () => {
    authorizationsRepositoryMock.findOneBy.mockResolvedValue(null);

    await expect(
      service.ensureWorkshopCanWrite('vehicle-1', 'workshop-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws ForbiddenException when the authorization is read-only', async () => {
    authorizationsRepositoryMock.findOneBy.mockResolvedValue({
      canRead: true,
      canWrite: false,
    });

    await expect(
      service.ensureWorkshopCanWrite('vehicle-1', 'workshop-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows the workshop to write when the authorization has write permission', async () => {
    authorizationsRepositoryMock.findOneBy.mockResolvedValue({
      canRead: true,
      canWrite: true,
    });

    await service.ensureWorkshopCanWrite('vehicle-1', 'workshop-1');

    expect(authorizationsRepositoryMock.findOneBy).toHaveBeenCalledWith({
      vehicleId: 'vehicle-1',
      workshopId: 'workshop-1',
      status: 'active',
    });
  });

  it('returns the vehicle without checking authorizations when the user is the owner', async () => {
    const vehicle = { id: 'vehicle-1', ownerId: 'owner-1' } as VehicleEntity;

    vehiclesServiceMock.findOne.mockResolvedValue(vehicle);

    const result = await service.ensureVehicleReadAccess(
      'vehicle-1',
      'owner-1',
    );

    expect(result).toEqual(vehicle);
    expect(authorizationsRepositoryMock.findOneBy).not.toHaveBeenCalled();
  });

  it('returns the vehicle when a workshop has read authorization', async () => {
    const vehicle = { id: 'vehicle-1', ownerId: 'owner-1' } as VehicleEntity;

    vehiclesServiceMock.findOne.mockResolvedValue(vehicle);
    authorizationsRepositoryMock.findOneBy.mockResolvedValue({
      canRead: true,
      canWrite: false,
    });

    const result = await service.ensureVehicleReadAccess(
      'vehicle-1',
      'workshop-1',
    );

    expect(result).toEqual(vehicle);
  });

  it('throws ForbiddenException when the user has no read authorization', async () => {
    const vehicle = { id: 'vehicle-1', ownerId: 'owner-1' } as VehicleEntity;

    vehiclesServiceMock.findOne.mockResolvedValue(vehicle);
    authorizationsRepositoryMock.findOneBy.mockResolvedValue(null);

    await expect(
      service.ensureVehicleReadAccess('vehicle-1', 'stranger-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VehicleEntity } from './entities/vehicle.entity';
import { VehiclesService } from './vehicles.service';

describe('VehiclesService', () => {
  let service: VehiclesService;

  const repositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    existsBy: jest.fn(),
    merge: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: getRepositoryToken(VehicleEntity),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = moduleRef.get(VehiclesService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a vehicle with the plate in uppercase', async () => {
    const built = { plate: 'ABC123' } as VehicleEntity;
    const saved = { id: 'vehicle-1', plate: 'ABC123' } as VehicleEntity;

    repositoryMock.existsBy.mockResolvedValue(false);
    repositoryMock.create.mockReturnValue(built);
    repositoryMock.save.mockResolvedValue(saved);

    const result = await service.create('owner-1', {
      plate: 'abc123',
      brand: 'Mazda',
      model: '3',
    });

    expect(repositoryMock.create).toHaveBeenCalledWith({
      ownerId: 'owner-1',
      plate: 'ABC123',
      brand: 'Mazda',
      model: '3',
      year: null,
      currentKilometers: 0,
    });
    expect(repositoryMock.save).toHaveBeenCalledWith(built);
    expect(result).toEqual(saved);
  });

  it('does not create a vehicle when the plate is already registered', async () => {
    repositoryMock.existsBy.mockResolvedValue(true);

    await expect(
      service.create('owner-1', {
        plate: 'ABC123',
        brand: 'Mazda',
        model: '3',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repositoryMock.save).not.toHaveBeenCalled();
  });

  it('returns the vehicles of an owner, newest first', async () => {
    const vehicles = [
      { id: 'vehicle-1', ownerId: 'owner-1' },
      { id: 'vehicle-2', ownerId: 'owner-1' },
    ] as VehicleEntity[];

    repositoryMock.find.mockResolvedValue(vehicles);

    const result = await service.findAllByOwner('owner-1');

    expect(result).toEqual(vehicles);
    expect(repositoryMock.find).toHaveBeenCalledWith({
      where: { ownerId: 'owner-1' },
      order: { createdAt: 'DESC' },
    });
  });

  it('returns a vehicle when the id exists', async () => {
    const vehicle = { id: 'vehicle-1', plate: 'ABC123' } as VehicleEntity;

    repositoryMock.findOneBy.mockResolvedValue(vehicle);

    const result = await service.findOne('vehicle-1');

    expect(result).toEqual(vehicle);
    expect(repositoryMock.findOneBy).toHaveBeenCalledWith({ id: 'vehicle-1' });
  });

  it('throws NotFoundException when the vehicle id does not exist', async () => {
    repositoryMock.findOneBy.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('finds a vehicle by plate using uppercase', async () => {
    const vehicle = { id: 'vehicle-1', plate: 'ABC123' } as VehicleEntity;

    repositoryMock.findOneBy.mockResolvedValue(vehicle);

    const result = await service.findByPlate('abc123');

    expect(result).toEqual(vehicle);
    expect(repositoryMock.findOneBy).toHaveBeenCalledWith({ plate: 'ABC123' });
  });

  it('throws NotFoundException when the plate does not exist', async () => {
    repositoryMock.findOneBy.mockResolvedValue(null);

    await expect(service.findByPlate('zzz999')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns the vehicle when the user is the owner', async () => {
    const vehicle = { id: 'vehicle-1', ownerId: 'owner-1' } as VehicleEntity;

    repositoryMock.findOneBy.mockResolvedValue(vehicle);

    const result = await service.findOwnedOrFail('vehicle-1', 'owner-1');

    expect(result).toEqual(vehicle);
  });

  it('throws ForbiddenException when the user is not the owner', async () => {
    const vehicle = { id: 'vehicle-1', ownerId: 'owner-1' } as VehicleEntity;

    repositoryMock.findOneBy.mockResolvedValue(vehicle);

    await expect(
      service.findOwnedOrFail('vehicle-1', 'another-user'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('updates a vehicle and saves it', async () => {
    const vehicle = {
      id: 'vehicle-1',
      ownerId: 'owner-1',
      plate: 'ABC123',
      currentKilometers: 10000,
    } as VehicleEntity;
    const saved = { ...vehicle, currentKilometers: 12000 } as VehicleEntity;

    repositoryMock.findOneBy.mockResolvedValue(vehicle);
    repositoryMock.save.mockResolvedValue(saved);

    const result = await service.update('vehicle-1', 'owner-1', {
      currentKilometers: 12000,
    });

    expect(repositoryMock.merge).toHaveBeenCalledWith(
      vehicle,
      expect.objectContaining({ currentKilometers: 12000 }),
    );
    expect(repositoryMock.save).toHaveBeenCalledWith(vehicle);
    expect(result).toEqual(saved);
  });

  it('does not update when the kilometers are lower than the registered value', async () => {
    const vehicle = {
      id: 'vehicle-1',
      ownerId: 'owner-1',
      plate: 'ABC123',
      currentKilometers: 10000,
    } as VehicleEntity;

    repositoryMock.findOneBy.mockResolvedValue(vehicle);

    await expect(
      service.update('vehicle-1', 'owner-1', { currentKilometers: 5000 }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repositoryMock.save).not.toHaveBeenCalled();
  });

  it('does not update when the new plate is already registered', async () => {
    const vehicle = {
      id: 'vehicle-1',
      ownerId: 'owner-1',
      plate: 'ABC123',
      currentKilometers: 10000,
    } as VehicleEntity;

    repositoryMock.findOneBy.mockResolvedValue(vehicle);
    repositoryMock.existsBy.mockResolvedValue(true);

    await expect(
      service.update('vehicle-1', 'owner-1', { plate: 'xyz789' }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repositoryMock.save).not.toHaveBeenCalled();
  });

  it('does not check the plate availability when the plate does not change', async () => {
    const vehicle = {
      id: 'vehicle-1',
      ownerId: 'owner-1',
      plate: 'ABC123',
      currentKilometers: 10000,
    } as VehicleEntity;

    repositoryMock.findOneBy.mockResolvedValue(vehicle);
    repositoryMock.save.mockResolvedValue(vehicle);

    await service.update('vehicle-1', 'owner-1', { plate: 'abc123' });

    expect(repositoryMock.existsBy).not.toHaveBeenCalled();
    expect(repositoryMock.save).toHaveBeenCalledWith(vehicle);
  });

  it('does not update a vehicle that belongs to another user', async () => {
    const vehicle = { id: 'vehicle-1', ownerId: 'owner-1' } as VehicleEntity;

    repositoryMock.findOneBy.mockResolvedValue(vehicle);

    await expect(
      service.update('vehicle-1', 'another-user', { brand: 'Kia' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(repositoryMock.save).not.toHaveBeenCalled();
  });

  it('registers kilometers only for the given vehicle', async () => {
    repositoryMock.update.mockResolvedValue(undefined);

    await service.registerKilometers('vehicle-1', 15000);

    expect(repositoryMock.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'vehicle-1' }),
      { currentKilometers: 15000 },
    );
  });
});

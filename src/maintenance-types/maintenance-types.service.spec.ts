import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MaintenanceTypeEntity } from './entities/maintenance-type.entity';
import { MaintenanceTypesService } from './maintenance-types.service';

describe('MaintenanceTypesService', () => {
  let service: MaintenanceTypesService;

  const repositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    existsBy: jest.fn(),
    merge: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        MaintenanceTypesService,
        {
          provide: getRepositoryToken(MaintenanceTypeEntity),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = moduleRef.get(MaintenanceTypesService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a maintenance type with default values', async () => {
    const built = { name: 'Oil change' } as MaintenanceTypeEntity;
    const saved = { id: 'type-1', name: 'Oil change' } as MaintenanceTypeEntity;

    repositoryMock.existsBy.mockResolvedValue(false);
    repositoryMock.create.mockReturnValue(built);
    repositoryMock.save.mockResolvedValue(saved);

    const result = await service.create({ name: 'Oil change' });

    expect(repositoryMock.create).toHaveBeenCalledWith({
      name: 'Oil change',
      description: null,
      defaultIntervalKm: null,
      defaultIntervalMonths: null,
      isActive: true,
    });
    expect(repositoryMock.save).toHaveBeenCalledWith(built);
    expect(result).toEqual(saved);
  });

  it('does not create a maintenance type when the name already exists', async () => {
    repositoryMock.existsBy.mockResolvedValue(true);

    await expect(service.create({ name: 'Oil change' })).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(repositoryMock.save).not.toHaveBeenCalled();
  });

  it('returns only active maintenance types ordered by name', async () => {
    const types = [
      { id: 'type-1', name: 'Brakes' },
      { id: 'type-2', name: 'Oil change' },
    ] as MaintenanceTypeEntity[];

    repositoryMock.find.mockResolvedValue(types);

    const result = await service.findAll();

    expect(result).toEqual(types);
    expect(repositoryMock.find).toHaveBeenCalledWith({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  });

  it('returns a maintenance type when the id exists', async () => {
    const type = { id: 'type-1', name: 'Brakes' } as MaintenanceTypeEntity;

    repositoryMock.findOneBy.mockResolvedValue(type);

    const result = await service.findOne('type-1');

    expect(result).toEqual(type);
    expect(repositoryMock.findOneBy).toHaveBeenCalledWith({ id: 'type-1' });
  });

  it('throws NotFoundException when the id does not exist', async () => {
    repositoryMock.findOneBy.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns an active maintenance type with findActiveOrFail', async () => {
    const type = {
      id: 'type-1',
      name: 'Brakes',
      isActive: true,
    } as MaintenanceTypeEntity;

    repositoryMock.findOneBy.mockResolvedValue(type);

    const result = await service.findActiveOrFail('type-1');

    expect(result).toEqual(type);
  });

  it('throws BadRequestException when the maintenance type is not active', async () => {
    const type = {
      id: 'type-1',
      name: 'Brakes',
      isActive: false,
    } as MaintenanceTypeEntity;

    repositoryMock.findOneBy.mockResolvedValue(type);

    await expect(service.findActiveOrFail('type-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('updates a maintenance type and saves it', async () => {
    const type = { id: 'type-1', name: 'Brakes' } as MaintenanceTypeEntity;
    const saved = { id: 'type-1', name: 'Brakes', description: 'New' } as MaintenanceTypeEntity;

    repositoryMock.findOneBy.mockResolvedValue(type);
    repositoryMock.save.mockResolvedValue(saved);

    const result = await service.update('type-1', { description: 'New' });

    expect(repositoryMock.merge).toHaveBeenCalledWith(type, {
      description: 'New',
    });
    expect(repositoryMock.save).toHaveBeenCalledWith(type);
    expect(result).toEqual(saved);
  });

  it('does not update when the new name already exists', async () => {
    const type = { id: 'type-1', name: 'Brakes' } as MaintenanceTypeEntity;

    repositoryMock.findOneBy.mockResolvedValue(type);
    repositoryMock.existsBy.mockResolvedValue(true);

    await expect(
      service.update('type-1', { name: 'Oil change' }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repositoryMock.save).not.toHaveBeenCalled();
  });
});

import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { LessThan, Repository } from 'typeorm';
  import { CreateVehicleDto } from './dto/create-vehicle.dto';
  import { UpdateVehicleDto } from './dto/update-vehicle.dto';
  import { VehicleEntity } from './entities/vehicle.entity';
  
  @Injectable()
  export class VehiclesService {
    constructor(
      @InjectRepository(VehicleEntity)
      private readonly vehiclesRepository: Repository<VehicleEntity>,
    ) {}
  
    async create(ownerId: string, dto: CreateVehicleDto): Promise<VehicleEntity> {
      const plate = dto.plate.toUpperCase();
      await this.ensurePlateIsAvailable(plate);
  
      const vehicle = this.vehiclesRepository.create({
        ownerId,
        plate,
        brand: dto.brand,
        model: dto.model,
        year: dto.year ?? null,
        currentKilometers: dto.currentKilometers ?? 0,
      });
  
      return this.vehiclesRepository.save(vehicle);
    }
  
    findAllByOwner(ownerId: string): Promise<VehicleEntity[]> {
      return this.vehiclesRepository.find({
        where: { ownerId },
        order: { createdAt: 'DESC' },
      });
    }
  
    async findOne(id: string): Promise<VehicleEntity> {
      const vehicle = await this.vehiclesRepository.findOneBy({ id });
  
      if (!vehicle) {
        throw new NotFoundException(`Vehicle with id ${id} not found`);
      }
  
      return vehicle;
    }
  
    async findByPlate(plate: string): Promise<VehicleEntity> {
      const normalizedPlate = plate.toUpperCase();
      const vehicle = await this.vehiclesRepository.findOneBy({
        plate: normalizedPlate,
      });
  
      if (!vehicle) {
        throw new NotFoundException(
          `Vehicle with plate ${normalizedPlate} not found`,
        );
      }
  
      return vehicle;
    }
  
    async findOwnedOrFail(id: string, userId: string): Promise<VehicleEntity> {
      const vehicle = await this.findOne(id);
  
      if (vehicle.ownerId !== userId) {
        throw new ForbiddenException('You are not the owner of this vehicle');
      }
  
      return vehicle;
    }
  
    async update(
      id: string,
      userId: string,
      dto: UpdateVehicleDto,
    ): Promise<VehicleEntity> {
      const vehicle = await this.findOwnedOrFail(id, userId);
      const plate = dto.plate?.toUpperCase();
  
      if (plate && plate !== vehicle.plate) {
        await this.ensurePlateIsAvailable(plate);
      }
  
      if (
        dto.currentKilometers !== undefined &&
        dto.currentKilometers < vehicle.currentKilometers
      ) {
        throw new BadRequestException(
          'Current kilometers cannot be lower than the registered value',
        );
      }
  
      this.vehiclesRepository.merge(vehicle, { ...dto, plate });
  
      return this.vehiclesRepository.save(vehicle);
    }
  
    async registerKilometers(id: string, kilometers: number): Promise<void> {
      await this.vehiclesRepository.update(
        { id, currentKilometers: LessThan(kilometers) },
        { currentKilometers: kilometers },
      );
    }
  
    private async ensurePlateIsAvailable(plate: string): Promise<void> {
      const exists = await this.vehiclesRepository.existsBy({ plate });
  
      if (exists) {
        throw new ConflictException('Plate already registered');
      }
    }
  }
  
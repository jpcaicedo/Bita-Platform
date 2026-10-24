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
  
    
  }
  
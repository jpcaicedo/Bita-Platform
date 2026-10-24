import {
    Injectable,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { CreateMaintenanceTypeDto } from './dto/create-maintenance-type.dto';

  import { MaintenanceTypeEntity } from './entities/maintenance-type.entity';
  
  @Injectable()
  export class MaintenanceTypesService {
    constructor(
      @InjectRepository(MaintenanceTypeEntity)
      private readonly maintenanceTypesRepository: Repository<MaintenanceTypeEntity>,
    ) {}
  
    async create(dto: CreateMaintenanceTypeDto): Promise<MaintenanceTypeEntity> {
     
  
      const maintenanceType = this.maintenanceTypesRepository.create({
        name: dto.name,
        description: dto.description ?? null,
        defaultIntervalKm: dto.defaultIntervalKm ?? null,
        defaultIntervalMonths: dto.defaultIntervalMonths ?? null,
        isActive: dto.isActive ?? true,
      });
  
      return this.maintenanceTypesRepository.save(maintenanceType);
    }
  
  }
  
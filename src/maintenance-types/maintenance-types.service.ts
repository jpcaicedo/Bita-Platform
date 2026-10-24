import {
    BadRequestException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { CreateMaintenanceTypeDto } from './dto/create-maintenance-type.dto';
  import { UpdateMaintenanceTypeDto } from './dto/update-maintenance-type.dto';
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
  
    findAll(): Promise<MaintenanceTypeEntity[]> {
      return this.maintenanceTypesRepository.find({
        where: { isActive: true },
        order: { name: 'ASC' },
      });
    }
  
    async findOne(id: string): Promise<MaintenanceTypeEntity> {
      const maintenanceType = await this.maintenanceTypesRepository.findOneBy({
        id,
      });
  
      if (!maintenanceType) {
        throw new NotFoundException(`Maintenance type with id ${id} not found`);
      }
  
      return maintenanceType;
    }
  
    async findActiveOrFail(id: string): Promise<MaintenanceTypeEntity> {
      const maintenanceType = await this.findOne(id);
  
      if (!maintenanceType.isActive) {
        throw new BadRequestException('Maintenance type is not active');
      }
  
      return maintenanceType;
    }
  
    async update(
      id: string,
      dto: UpdateMaintenanceTypeDto,
    ): Promise<MaintenanceTypeEntity> {
      const maintenanceType = await this.findOne(id);   
      this.maintenanceTypesRepository.merge(maintenanceType, dto);
  
      return this.maintenanceTypesRepository.save(maintenanceType);
    }
  
   
  }
  
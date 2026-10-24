import {
    Injectable,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm'
  import { MaintenanceTypeEntity } from './entities/maintenance-type.entity';
  
  @Injectable()
  export class MaintenanceTypesService {
    constructor(
      @InjectRepository(MaintenanceTypeEntity)
      private readonly maintenanceTypesRepository: Repository<MaintenanceTypeEntity>,
    ) {}
  
  }
  
import {
    Injectable,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { AuthorizationsService } from '../authorizations/authorizations.service';
  import { VehiclesService } from '../vehicles/vehicles.service';
  import { WorkshopProfileEntity } from './entities/workshop-profile.entity';
  
  @Injectable()
  export class WorkshopsService {
    constructor(
      @InjectRepository(WorkshopProfileEntity)
      private readonly workshopProfilesRepository: Repository<WorkshopProfileEntity>,
      private readonly vehiclesService: VehiclesService,
      private readonly authorizationsService: AuthorizationsService,
    ) {}
  
  }
  
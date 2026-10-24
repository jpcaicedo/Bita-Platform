import {
    Injectable,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';

  import { VehiclesService } from '../vehicles/vehicles.service';
  import { WorkshopProfileEntity } from '../workshops/entities/workshop-profile.entity';
  import { AuthorizationRulesService } from './authorization-rules.service';
  import { WorkshopAuthorizationEntity } from './entities/workshop-authorization.entity';
  
  @Injectable()
  export class AuthorizationsService {
    constructor(
      @InjectRepository(WorkshopAuthorizationEntity)
      private readonly authorizationsRepository: Repository<WorkshopAuthorizationEntity>,
      @InjectRepository(WorkshopProfileEntity)
      private readonly workshopProfilesRepository: Repository<WorkshopProfileEntity>,
      private readonly vehiclesService: VehiclesService,
      private readonly authorizationRulesService: AuthorizationRulesService,
    ) {}
  

  }
  
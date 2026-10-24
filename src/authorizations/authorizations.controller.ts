import {
    BadRequestException,
    ConflictException,
    Injectable,
  } from '@nestjs/common';
  import { WorkshopAuthorizationEntity } from './entities/workshop-authorization.entity';
  
  @Injectable()
  export class AuthorizationRulesService {
    ensureValidPermissions(canRead: boolean, canWrite: boolean): void {
      if (canWrite && !canRead) {
        throw new BadRequestException('Write permission requires read permission');
      }
    }
  
  }
  
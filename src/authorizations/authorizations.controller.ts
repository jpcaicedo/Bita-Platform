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
  
    ensureWorkshopIsNotOwner(ownerId: string, workshopId: string): void {
      if (ownerId === workshopId) {
        throw new BadRequestException(
          'The owner cannot authorize himself as a workshop',
        );
      }
    }
  
    ensureCanBeRevoked(authorization: WorkshopAuthorizationEntity): void {
      if (authorization.status !== 'active') {
        throw new ConflictException('Authorization is already revoked');
      }
    }
  }
  
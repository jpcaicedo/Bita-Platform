import {
    ForbiddenException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { AuthenticatedUser } from '../auth/authenticated-user.interface';
  import { VehicleEntity } from '../vehicles/entities/vehicle.entity';
  import { VehiclesService } from '../vehicles/vehicles.service';
  import { WorkshopProfileEntity } from '../workshops/entities/workshop-profile.entity';
  import { AuthorizationRulesService } from './authorization-rules.service';
  import { CreateAuthorizationDto } from './dto/create-authorization.dto';
  import { RevokeAuthorizationDto } from './dto/revoke-authorization.dto';
  import { AuthorizationLogEntity } from './entities/authorization-log.entity';
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
  
    async grant(
      vehicleId: string,
      user: AuthenticatedUser,
      dto: CreateAuthorizationDto,
    ): Promise<WorkshopAuthorizationEntity> {
      const vehicle = await this.vehiclesService.findOwnedOrFail(
        vehicleId,
        user.id,
      );
      const canRead = dto.canRead ?? true;
      const canWrite = dto.canWrite ?? false;
  
      this.authorizationRulesService.ensureValidPermissions(canRead, canWrite);
      this.authorizationRulesService.ensureWorkshopIsNotOwner(
        vehicle.ownerId,
        dto.workshopId,
      );
  
      const isWorkshop = await this.workshopProfilesRepository.existsBy({
        userId: dto.workshopId,
      });
  
      if (!isWorkshop) {
        throw new NotFoundException('Workshop not found');
      }
  
      const existing = await this.findActive(vehicle.id, dto.workshopId);
      const previous = existing
        ? { canRead: existing.canRead, canWrite: existing.canWrite }
        : null;
  
      const authorization =
        existing ??
        this.authorizationsRepository.create({
          vehicleId: vehicle.id,
          workshopId: dto.workshopId,
          grantedById: user.id,
        });
  
      authorization.canRead = canRead;
      authorization.canWrite = canWrite;
      authorization.status = 'active';
  
      return this.authorizationsRepository.manager.transaction(
        async (manager) => {
          const saved = await manager.save(
            WorkshopAuthorizationEntity,
            authorization,
          );
          const log = manager.create(AuthorizationLogEntity, {
            authorizationId: saved.id,
            performedById: user.id,
            action: 'GRANT',
            metadata: {
              workshopId: dto.workshopId,
              canRead,
              canWrite,
              previous,
            },
          });
          await manager.save(log);
          return saved;
        },
      );
    }
  
    async revoke(
      id: string,
      user: AuthenticatedUser,
      dto: RevokeAuthorizationDto,
    ): Promise<WorkshopAuthorizationEntity> {
      const authorization = await this.authorizationsRepository.findOne({
        where: { id },
        relations: { vehicle: true },
      });
  
      if (!authorization) {
        throw new NotFoundException(`Authorization with id ${id} not found`);
      }
  
      if (authorization.vehicle.ownerId !== user.id) {
        throw new ForbiddenException('You are not the owner of this vehicle');
      }
  
      this.authorizationRulesService.ensureCanBeRevoked(authorization);
  
      authorization.status = 'revoked';
  
      return this.authorizationsRepository.manager.transaction(
        async (manager) => {
          const saved = await manager.save(
            WorkshopAuthorizationEntity,
            authorization,
          );
          const log = manager.create(AuthorizationLogEntity, {
            authorizationId: saved.id,
            performedById: user.id,
            action: 'REVOKE',
            metadata: {
              workshopId: saved.workshopId,
              reason: dto.reason ?? null,
            },
          });
          await manager.save(log);
          return saved;
        },
      );
    }
  
    async findByVehicle(
      vehicleId: string,
      userId: string,
    ): Promise<WorkshopAuthorizationEntity[]> {
      await this.vehiclesService.findOwnedOrFail(vehicleId, userId);
  
      return this.authorizationsRepository.find({ where: { vehicleId } });
    }
  
    findActive(
      vehicleId: string,
      workshopId: string,
    ): Promise<WorkshopAuthorizationEntity | null> {
      return this.authorizationsRepository.findOneBy({
        vehicleId,
        workshopId,
        status: 'active',
      });
    }
  
    findActiveByWorkshop(
      workshopId: string,
    ): Promise<WorkshopAuthorizationEntity[]> {
      return this.authorizationsRepository.find({
        where: { workshopId, status: 'active' },
        relations: { vehicle: true },
      });
    }
  
    async ensureWorkshopCanWrite(
      vehicleId: string,
      workshopId: string,
    ): Promise<void> {
      const authorization = await this.findActive(vehicleId, workshopId);
  
      if (!authorization || !authorization.canWrite) {
        throw new ForbiddenException(
          'Workshop has no active write authorization for this vehicle',
        );
      }
    }
  
    async ensureVehicleReadAccess(
      vehicleId: string,
      userId: string,
    ): Promise<VehicleEntity> {
      const vehicle = await this.vehiclesService.findOne(vehicleId);
  
      if (vehicle.ownerId === userId) {
        return vehicle;
      }
  
      const authorization = await this.findActive(vehicleId, userId);
  
      if (!authorization || !authorization.canRead) {
        throw new ForbiddenException(
          'You have no active read authorization for this vehicle',
        );
      }
  
      return vehicle;
    }
  }
  
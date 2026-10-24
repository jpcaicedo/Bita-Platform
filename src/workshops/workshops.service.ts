import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { AuthorizationsService } from '../authorizations/authorizations.service';
  import { VehiclesService } from '../vehicles/vehicles.service';
  import { CreateWorkshopProfileDto } from './dto/create-workshop-profile.dto';
  import { UpdateWorkshopProfileDto } from './dto/update-workshop-profile.dto';
  import { WorkshopProfileEntity } from './entities/workshop-profile.entity';
  
  @Injectable()
  export class WorkshopsService {
    constructor(
      @InjectRepository(WorkshopProfileEntity)
      private readonly workshopProfilesRepository: Repository<WorkshopProfileEntity>,
      private readonly vehiclesService: VehiclesService,
      private readonly authorizationsService: AuthorizationsService,
    ) {}
  
    async create(
      userId: string,
      dto: CreateWorkshopProfileDto,
    ): Promise<WorkshopProfileEntity> {
      const exists = await this.workshopProfilesRepository.existsBy({ userId });
  
      if (exists) {
        throw new ConflictException('Workshop profile already exists');
      }
  
      const profile = this.workshopProfilesRepository.create({
        userId,
        name: dto.name,
        businessName: dto.businessName ?? null,
        identification: dto.identification ?? null,
      });
  
      return this.workshopProfilesRepository.save(profile);
    }
  
    async findByUser(userId: string): Promise<WorkshopProfileEntity> {
      const profile = await this.workshopProfilesRepository.findOneBy({
        userId,
      });
  
      if (!profile) {
        throw new NotFoundException('Workshop profile not found');
      }
  
      return profile;
    }
  
    async update(
      userId: string,
      dto: UpdateWorkshopProfileDto,
    ): Promise<WorkshopProfileEntity> {
      const profile = await this.findByUser(userId);
  
      this.workshopProfilesRepository.merge(profile, dto);
  
      return this.workshopProfilesRepository.save(profile);
    }
  
    async ensureIsWorkshop(userId: string): Promise<void> {
      const isWorkshop = await this.workshopProfilesRepository.existsBy({
        userId,
      });
  
      if (!isWorkshop) {
        throw new ForbiddenException('Only workshops can perform this action');
      }
    }
  
    async ensureWorkshopExists(userId: string): Promise<void> {
      const exists = await this.workshopProfilesRepository.existsBy({ userId });
  
      if (!exists) {
        throw new NotFoundException('Workshop not found');
      }
    }
  
    async findAuthorizedVehicles(workshopId: string) {
      await this.ensureIsWorkshop(workshopId);
  
      const authorizations =
        await this.authorizationsService.findActiveByWorkshop(workshopId);
  
      return authorizations.map((authorization) => ({
        authorizationId: authorization.id,
        canRead: authorization.canRead,
        canWrite: authorization.canWrite,
        vehicle: {
          id: authorization.vehicle.id,
          plate: authorization.vehicle.plate,
          brand: authorization.vehicle.brand,
          model: authorization.vehicle.model,
          year: authorization.vehicle.year,
          currentKilometers: authorization.canRead
            ? authorization.vehicle.currentKilometers
            : null,
        },
      }));
    }
  
  }
  
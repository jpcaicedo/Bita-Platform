import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { AuthorizationsService } from '../authorizations/authorizations.service';
import { MaintenanceTypesService } from '../maintenance-types/maintenance-types.service';
import { RemindersService } from '../reminders/reminders.service';
import { VehicleEntity } from '../vehicles/entities/vehicle.entity';
import { VehiclesService } from '../vehicles/vehicles.service';
import { WorkshopsService } from '../workshops/workshops.service';
import { CreateMaintenanceRecordDto } from './dto/create-maintenance-record.dto';
import { QueryMaintenanceRecordsDto } from './dto/query-maintenance-records.dto';
import { MaintenanceRecordEntity } from './entities/maintenance-record.entity';
import { MaintenanceRulesService } from './maintenance-rules.service';

@Injectable()
export class MaintenanceRecordsService {
  constructor(
    @InjectRepository(MaintenanceRecordEntity)
    private readonly recordsRepository: Repository<MaintenanceRecordEntity>,
    private readonly vehiclesService: VehiclesService,
    private readonly maintenanceTypesService: MaintenanceTypesService,
    private readonly authorizationsService: AuthorizationsService,
    private readonly workshopsService: WorkshopsService,
    private readonly remindersService: RemindersService,
    private readonly maintenanceRulesService: MaintenanceRulesService,
  ) {}

  async createByOwner(
    vehicleId: string,
    user: AuthenticatedUser,
    dto: CreateMaintenanceRecordDto,
  ) {
    const vehicle = await this.vehiclesService.findOwnedOrFail(
      vehicleId,
      user.id,
    );

    if (dto.workshopId) {
      await this.workshopsService.ensureWorkshopExists(dto.workshopId);
    }

    return this.register(vehicle, user.id, dto.workshopId ?? null, dto);
  }

  async createByWorkshop(
    vehicleId: string,
    user: AuthenticatedUser,
    dto: CreateMaintenanceRecordDto,
  ) {
    await this.workshopsService.ensureIsWorkshop(user.id);

    const vehicle = await this.vehiclesService.findOne(vehicleId);

    await this.authorizationsService.ensureWorkshopCanWrite(
      vehicle.id,
      user.id,
    );

    return this.register(vehicle, user.id, user.id, dto);
  }

  async findByVehicle(
    vehicleId: string,
    user: AuthenticatedUser,
    query: QueryMaintenanceRecordsDto,
  ): Promise<MaintenanceRecordEntity[]> {
    await this.authorizationsService.ensureVehicleReadAccess(
      vehicleId,
      user.id,
    );

    const where: FindOptionsWhere<MaintenanceRecordEntity> = { vehicleId };

    if (query.maintenanceTypeId) {
      where.maintenanceTypeId = query.maintenanceTypeId;
    }

    if (query.workshopId) {
      where.workshopId = query.workshopId;
    }

    const from = query.from?.slice(0, 10);
    const to = query.to?.slice(0, 10);

    if (from && to) {
      where.serviceDate = Between(from, to);
    } else if (from) {
      where.serviceDate = MoreThanOrEqual(from);
    } else if (to) {
      where.serviceDate = LessThanOrEqual(to);
    }

    return this.recordsRepository.find({
      where,
      relations: { maintenanceType: true },
      order: { serviceDate: 'DESC', createdAt: 'DESC' },
      take: query.limit,
    });
  }

  async getHealth(vehicleId: string, user: AuthenticatedUser) {
    const vehicle = await this.authorizationsService.ensureVehicleReadAccess(
      vehicleId,
      user.id,
    );

    const records = await this.recordsRepository.find({
      where: { vehicleId },
      relations: { maintenanceType: true },
      order: { serviceDate: 'DESC', createdAt: 'DESC' },
    });

    const latestByType = new Map<string, MaintenanceRecordEntity>();

    for (const record of records) {
      if (!latestByType.has(record.maintenanceTypeId)) {
        latestByType.set(record.maintenanceTypeId, record);
      }
    }

    return Array.from(latestByType.values())
      .map((record) => {
        const next = this.maintenanceRulesService.calculateNext(
          record.maintenanceType,
          record.serviceDate,
          record.kilometers,
        );

        return {
          maintenanceType: {
            id: record.maintenanceType.id,
            name: record.maintenanceType.name,
          },
          lastServiceDate: record.serviceDate,
          lastKilometers: record.kilometers,
          nextMaintenance: next,
          status: this.maintenanceRulesService.calculateHealthStatus(
            next,
            vehicle.currentKilometers,
          ),
        };
      })
      .filter(
        (item) =>
          item.nextMaintenance.dueDate !== null ||
          item.nextMaintenance.dueKilometers !== null,
      );
  }

  private async register(
    vehicle: VehicleEntity,
    registeredById: string,
    workshopId: string | null,
    dto: CreateMaintenanceRecordDto,
  ) {
    const maintenanceType =
      await this.maintenanceTypesService.findActiveOrFail(
        dto.maintenanceTypeId,
      );
    const serviceDate = dto.serviceDate.slice(0, 10);

    this.maintenanceRulesService.ensureServiceDateIsNotInFuture(serviceDate);

    const lastRecord = await this.findLastRecord(vehicle.id);

    this.maintenanceRulesService.ensureKilometersAreNotLowerThanLast(
      dto.kilometers,
      lastRecord,
    );

    const record = this.recordsRepository.create({
      vehicleId: vehicle.id,
      maintenanceTypeId: maintenanceType.id,
      workshopId,
      registeredById,
      serviceDate,
      kilometers: dto.kilometers,
      cost: dto.cost ?? null,
      observations: dto.observations ?? null,
    });

    const savedRecord = await this.recordsRepository.save(record);

    await this.vehiclesService.registerKilometers(vehicle.id, dto.kilometers);
    await this.remindersService.completeFromMaintenance(
      vehicle.id,
      maintenanceType.id,
      serviceDate,
      dto.kilometers,
    );

    return {
      record: savedRecord,
      nextMaintenance: this.maintenanceRulesService.calculateNext(
        maintenanceType,
        serviceDate,
        dto.kilometers,
      ),
    };
  }

  private findLastRecord(
    vehicleId: string,
  ): Promise<MaintenanceRecordEntity | null> {
    return this.recordsRepository.findOne({
      where: { vehicleId },
      order: { kilometers: 'DESC' },
    });
  }
}
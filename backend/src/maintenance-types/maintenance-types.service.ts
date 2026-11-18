import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMaintenanceTypeDto } from './dto/create-maintenance-type.dto';
import { UpdateMaintenanceTypeDto } from './dto/update-maintenance-type.dto';
import { MaintenanceTypeEntity } from './entities/maintenance-type.entity';

// Catálogo mínimo que usan los chips de la bitácora (frentes A, B y C).
const BASE_MAINTENANCE_TYPES = [
  {
    name: 'Mantenimiento preventivo',
    description: 'Aceite, filtros y revisión general por kilometraje',
    defaultIntervalKm: 10000,
    defaultIntervalMonths: 6,
  },
  {
    name: 'Frenos / Pastillas',
    description: 'Revisión y cambio de pastillas, discos y líquido de frenos',
    defaultIntervalKm: 30000,
    defaultIntervalMonths: 24,
  },
  {
    name: 'Diagnóstico motor',
    description: 'Escaneo y diagnóstico de fallas del motor',
    defaultIntervalKm: null,
    defaultIntervalMonths: null,
  },
  {
    name: 'Suspensión',
    description: 'Amortiguadores, bujes y alineación',
    defaultIntervalKm: 50000,
    defaultIntervalMonths: 36,
  },
  {
    name: 'Sistema eléctrico',
    description: 'Batería, alternador y circuitos eléctricos',
    defaultIntervalKm: null,
    defaultIntervalMonths: null,
  },
  {
    name: 'Otro servicio',
    description: 'Intervenciones que no encajan en otra categoría',
    defaultIntervalKm: null,
    defaultIntervalMonths: null,
  },
];

@Injectable()
export class MaintenanceTypesService implements OnModuleInit {
  constructor(
    @InjectRepository(MaintenanceTypeEntity)
    private readonly maintenanceTypesRepository: Repository<MaintenanceTypeEntity>,
  ) {}

  // Al arrancar la app se asegura de que el catálogo base exista.
  // Es idempotente: solo crea los nombres que aún no están en la tabla.
  async onModuleInit(): Promise<void> {
    for (const type of BASE_MAINTENANCE_TYPES) {
      const exists = await this.maintenanceTypesRepository.existsBy({
        name: type.name,
      });

      if (exists) continue;

      await this.maintenanceTypesRepository.save(
        this.maintenanceTypesRepository.create(type),
      );
    }
  }

  async create(dto: CreateMaintenanceTypeDto): Promise<MaintenanceTypeEntity> {
    await this.ensureNameIsAvailable(dto.name);

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

    if (dto.name && dto.name !== maintenanceType.name) {
      await this.ensureNameIsAvailable(dto.name);
    }

    this.maintenanceTypesRepository.merge(maintenanceType, dto);

    return this.maintenanceTypesRepository.save(maintenanceType);
  }

  private async ensureNameIsAvailable(name: string): Promise<void> {
    const exists = await this.maintenanceTypesRepository.existsBy({ name });

    if (exists) {
      throw new ConflictException('Maintenance type name already registered');
    }
  }
}

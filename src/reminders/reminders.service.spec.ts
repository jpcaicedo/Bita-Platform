import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { MaintenanceTypesService } from '../maintenance-types/maintenance-types.service';
import { VehicleEntity } from '../vehicles/entities/vehicle.entity';
import { VehiclesService } from '../vehicles/vehicles.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { ReminderNotificationEntity } from './entities/reminder-notification.entity';
import { SmartReminderEntity } from './entities/smart-reminder.entity';
import { ReminderRulesService } from './reminder-rules.service';
import { RemindersService } from './reminders.service';

describe('RemindersService', () => {
  let service: RemindersService;

  const owner: AuthenticatedUser = {
    id: 'owner-1',
    email: 'owner@example.com',
    waid: null,
    phone: null,
  };

  const remindersRepositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const notificationsRepositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
    existsBy: jest.fn(),
  };

  const vehiclesServiceMock = {
    findOwnedOrFail: jest.fn(),
    registerKilometers: jest.fn(),
  };

  const maintenanceTypesServiceMock = {
    findActiveOrFail: jest.fn(),
  };

  const reminderRulesServiceMock = {
    ensureThresholdsAreValid: jest.fn(),
    ensureRecurrenceIsValid: jest.fn(),
    ensureCanBeCompleted: jest.fn(),
    ensureKilometersAreNotLower: jest.fn(),
    calculateNextCycle: jest.fn(),
    evaluateTrigger: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        RemindersService,
        {
          provide: getRepositoryToken(SmartReminderEntity),
          useValue: remindersRepositoryMock,
        },
        {
          provide: getRepositoryToken(ReminderNotificationEntity),
          useValue: notificationsRepositoryMock,
        },
        {
          provide: VehiclesService,
          useValue: vehiclesServiceMock,
        },
        {
          provide: MaintenanceTypesService,
          useValue: maintenanceTypesServiceMock,
        },
        {
          provide: ReminderRulesService,
          useValue: reminderRulesServiceMock,
        },
      ],
    }).compile();

    service = moduleRef.get(RemindersService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('validates the rules and saves a pending reminder with defaults', async () => {
    const dto: CreateReminderDto = {
      title: 'Oil change',
      criteria: 'due_kilometers',
      dueKilometers: 20000,
    };
    const vehicle = {
      id: 'vehicle-1',
      ownerId: 'owner-1',
      currentKilometers: 10000,
    } as VehicleEntity;
    const built = { title: 'Oil change' } as SmartReminderEntity;
    const saved = {
      id: 'reminder-1',
      title: 'Oil change',
    } as SmartReminderEntity;

    vehiclesServiceMock.findOwnedOrFail.mockResolvedValue(vehicle);
    remindersRepositoryMock.create.mockReturnValue(built);
    remindersRepositoryMock.save.mockResolvedValue(saved);

    const result = await service.create('vehicle-1', owner, dto);

    expect(
      reminderRulesServiceMock.ensureThresholdsAreValid,
    ).toHaveBeenCalledWith(dto, 10000);
    expect(
      reminderRulesServiceMock.ensureRecurrenceIsValid,
    ).toHaveBeenCalledWith(dto);
    expect(remindersRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        vehicleId: 'vehicle-1',
        createdById: 'owner-1',
        title: 'Oil change',
        dueKilometers: 20000,
        leadDays: 7,
        leadKilometers: 500,
        recurring: false,
        status: 'pending',
      }),
    );
    expect(remindersRepositoryMock.save).toHaveBeenCalledWith(built);
    expect(result).toEqual(saved);
  });

  it('checks the maintenance type when one is provided', async () => {
    const dto: CreateReminderDto = {
      title: 'Oil change',
      criteria: 'due_kilometers',
      dueKilometers: 20000,
      maintenanceTypeId: 'type-1',
    };
    const vehicle = {
      id: 'vehicle-1',
      ownerId: 'owner-1',
      currentKilometers: 10000,
    } as VehicleEntity;

    vehiclesServiceMock.findOwnedOrFail.mockResolvedValue(vehicle);
    remindersRepositoryMock.create.mockReturnValue({});
    remindersRepositoryMock.save.mockResolvedValue({});

    await service.create('vehicle-1', owner, dto);

    expect(maintenanceTypesServiceMock.findActiveOrFail).toHaveBeenCalledWith(
      'type-1',
    );
  });

  it('does not check the maintenance type when none is provided', async () => {
    const dto: CreateReminderDto = {
      title: 'Oil change',
      criteria: 'due_kilometers',
      dueKilometers: 20000,
    };
    const vehicle = {
      id: 'vehicle-1',
      ownerId: 'owner-1',
      currentKilometers: 10000,
    } as VehicleEntity;

    vehiclesServiceMock.findOwnedOrFail.mockResolvedValue(vehicle);
    remindersRepositoryMock.create.mockReturnValue({});
    remindersRepositoryMock.save.mockResolvedValue({});

    await service.create('vehicle-1', owner, dto);

    expect(maintenanceTypesServiceMock.findActiveOrFail).not.toHaveBeenCalled();
  });

  it('does not save when the thresholds rule rejects the data', async () => {
    const dto: CreateReminderDto = {
      title: 'Oil change',
      criteria: 'due_kilometers',
      dueKilometers: 20000,
    };
    const vehicle = {
      id: 'vehicle-1',
      ownerId: 'owner-1',
      currentKilometers: 10000,
    } as VehicleEntity;

    vehiclesServiceMock.findOwnedOrFail.mockResolvedValue(vehicle);
    reminderRulesServiceMock.ensureThresholdsAreValid.mockImplementation(() => {
      throw new BadRequestException('dueDate cannot be in the past');
    });

    await expect(
      service.create('vehicle-1', owner, dto),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(remindersRepositoryMock.save).not.toHaveBeenCalled();
  });

  it('does not create a reminder for a vehicle of another user', async () => {
    const dto: CreateReminderDto = {
      title: 'Oil change',
      criteria: 'due_kilometers',
      dueKilometers: 20000,
    };

    vehiclesServiceMock.findOwnedOrFail.mockImplementation(() => {
      throw new ForbiddenException('You are not the owner of this vehicle');
    });

    await expect(
      service.create('vehicle-1', owner, dto),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(remindersRepositoryMock.save).not.toHaveBeenCalled();
  });

  it('returns the reminders of a vehicle ordered by due date', async () => {
    const reminders = [{ id: 'reminder-1' }] as SmartReminderEntity[];

    vehiclesServiceMock.findOwnedOrFail.mockResolvedValue({} as VehicleEntity);
    remindersRepositoryMock.find.mockResolvedValue(reminders);

    const result = await service.findByVehicle('vehicle-1', 'owner-1');

    expect(result).toEqual(reminders);
    expect(remindersRepositoryMock.find).toHaveBeenCalledWith({
      where: { vehicleId: 'vehicle-1' },
      relations: { maintenanceType: true },
      order: { dueDate: 'ASC' },
    });
  });

  it('marks a non-recurring reminder as completed', async () => {
    const reminder = {
      id: 'reminder-1',
      vehicleId: 'vehicle-1',
      recurring: false,
      status: 'pending',
      vehicle: { ownerId: 'owner-1', currentKilometers: 10000 },
    } as SmartReminderEntity;

    remindersRepositoryMock.findOne.mockResolvedValue(reminder);
    remindersRepositoryMock.save.mockResolvedValue(reminder);

    await service.complete('reminder-1', owner, {});

    expect(reminderRulesServiceMock.ensureCanBeCompleted).toHaveBeenCalledWith(
      reminder,
    );
    expect(remindersRepositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'reminder-1', status: 'completed' }),
    );
    expect(vehiclesServiceMock.registerKilometers).not.toHaveBeenCalled();
  });

  it('registers the kilometers of the vehicle when they are provided', async () => {
    const reminder = {
      id: 'reminder-1',
      vehicleId: 'vehicle-1',
      recurring: false,
      status: 'pending',
      vehicle: { ownerId: 'owner-1', currentKilometers: 10000 },
    } as SmartReminderEntity;

    remindersRepositoryMock.findOne.mockResolvedValue(reminder);
    remindersRepositoryMock.save.mockResolvedValue(reminder);

    await service.complete('reminder-1', owner, { kilometers: 12000 });

    expect(
      reminderRulesServiceMock.ensureKilometersAreNotLower,
    ).toHaveBeenCalledWith(12000, 10000);
    expect(vehiclesServiceMock.registerKilometers).toHaveBeenCalledWith(
      'vehicle-1',
      12000,
    );
  });

  it('schedules the next cycle when the reminder is recurring', async () => {
    const reminder = {
      id: 'reminder-1',
      vehicleId: 'vehicle-1',
      recurring: true,
      status: 'notified',
      dueDate: '2026-01-01',
      dueKilometers: null,
      vehicle: { ownerId: 'owner-1', currentKilometers: 10000 },
    } as SmartReminderEntity;

    remindersRepositoryMock.findOne.mockResolvedValue(reminder);
    remindersRepositoryMock.save.mockResolvedValue(reminder);
    reminderRulesServiceMock.calculateNextCycle.mockReturnValue({
      dueDate: '2027-01-01',
      dueKilometers: null,
    });

    await service.complete('reminder-1', owner, {});

    expect(reminderRulesServiceMock.calculateNextCycle).toHaveBeenCalled();
    expect(remindersRepositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'pending',
        dueDate: '2027-01-01',
        lastNotifiedAt: null,
      }),
    );
  });

  it('throws NotFoundException when the reminder does not exist', async () => {
    remindersRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.complete('missing', owner, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('does not complete a reminder of a vehicle owned by another user', async () => {
    const reminder = {
      id: 'reminder-1',
      vehicle: { ownerId: 'another-owner', currentKilometers: 10000 },
    } as SmartReminderEntity;

    remindersRepositoryMock.findOne.mockResolvedValue(reminder);

    await expect(
      service.complete('reminder-1', owner, {}),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(remindersRepositoryMock.save).not.toHaveBeenCalled();
  });

  it('completes every open reminder of the vehicle and maintenance type', async () => {
    const reminders = [
      { id: 'reminder-1', recurring: false, status: 'pending' },
      { id: 'reminder-2', recurring: false, status: 'notified' },
    ] as SmartReminderEntity[];

    remindersRepositoryMock.find.mockResolvedValue(reminders);
    remindersRepositoryMock.save.mockResolvedValue({});

    await service.completeFromMaintenance(
      'vehicle-1',
      'type-1',
      '2026-10-01',
      15000,
    );

    expect(remindersRepositoryMock.save).toHaveBeenCalledTimes(2);
    expect(remindersRepositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'reminder-1', status: 'completed' }),
    );
    expect(remindersRepositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'reminder-2', status: 'completed' }),
    );
  });

  it('creates an email notification and marks the reminder as notified', async () => {
    const reminder = {
      id: 'reminder-1',
      dueDate: '2026-12-01',
      dueKilometers: null,
      vehicle: { currentKilometers: 10000 },
      createdBy: { waid: null },
    } as SmartReminderEntity;

    remindersRepositoryMock.find.mockResolvedValue([reminder]);
    reminderRulesServiceMock.evaluateTrigger.mockReturnValue('upcoming');
    notificationsRepositoryMock.existsBy.mockResolvedValue(false);
    notificationsRepositoryMock.create.mockReturnValue({ id: 'notification-1' });
    notificationsRepositoryMock.save.mockResolvedValue({});

    const created = await service.generateDueNotifications();

    expect(created).toBe(1);
    expect(notificationsRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        reminderId: 'reminder-1',
        channel: 'email',
        notificationType: 'upcoming',
        status: 'pending',
        idempotencyKey: 'reminder-1:upcoming:2026-12-01:none',
      }),
    );
    expect(notificationsRepositoryMock.save).toHaveBeenCalledTimes(1);
    expect(remindersRepositoryMock.update).toHaveBeenCalledWith(
      'reminder-1',
      expect.objectContaining({ status: 'notified' }),
    );
  });

  it('uses the whatsapp channel when the user has a waid', async () => {
    const reminder = {
      id: 'reminder-1',
      dueDate: '2026-12-01',
      dueKilometers: null,
      vehicle: { currentKilometers: 10000 },
      createdBy: { waid: '573001234567' },
    } as SmartReminderEntity;

    remindersRepositoryMock.find.mockResolvedValue([reminder]);
    reminderRulesServiceMock.evaluateTrigger.mockReturnValue('overdue');
    notificationsRepositoryMock.existsBy.mockResolvedValue(false);
    notificationsRepositoryMock.create.mockReturnValue({});
    notificationsRepositoryMock.save.mockResolvedValue({});

    await service.generateDueNotifications();

    expect(notificationsRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'whatsapp' }),
    );
  });

  it('skips reminders that have no trigger', async () => {
    const reminder = {
      id: 'reminder-1',
      dueDate: '2026-12-01',
      dueKilometers: null,
      vehicle: { currentKilometers: 10000 },
      createdBy: { waid: null },
    } as SmartReminderEntity;

    remindersRepositoryMock.find.mockResolvedValue([reminder]);
    reminderRulesServiceMock.evaluateTrigger.mockReturnValue(null);

    const created = await service.generateDueNotifications();

    expect(created).toBe(0);
    expect(notificationsRepositoryMock.save).not.toHaveBeenCalled();
    expect(remindersRepositoryMock.update).not.toHaveBeenCalled();
  });

  it('does not duplicate a notification that already exists', async () => {
    const reminder = {
      id: 'reminder-1',
      dueDate: '2026-12-01',
      dueKilometers: null,
      vehicle: { currentKilometers: 10000 },
      createdBy: { waid: null },
    } as SmartReminderEntity;

    remindersRepositoryMock.find.mockResolvedValue([reminder]);
    reminderRulesServiceMock.evaluateTrigger.mockReturnValue('upcoming');
    notificationsRepositoryMock.existsBy.mockResolvedValue(true);

    const created = await service.generateDueNotifications();

    expect(created).toBe(0);
    expect(notificationsRepositoryMock.save).not.toHaveBeenCalled();
    expect(remindersRepositoryMock.update).not.toHaveBeenCalled();
  });
});

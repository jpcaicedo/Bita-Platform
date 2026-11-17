export interface MaintenanceType {
  id: string;
  name: string;
  description: string | null;
  defaultIntervalKm: number | null;
  defaultIntervalMonths: number | null;
  isActive: boolean;
}

export interface NextMaintenance {
  dueDate: string | null;
  dueKilometers: number | null;
}

export type MaintenanceHealthStatus = 'up_to_date' | 'upcoming' | 'overdue';

export interface MaintenanceStatusItem {
  maintenanceType: {
    id: string;
    name: string;
  };
  lastServiceDate: string;
  lastKilometers: number;
  nextMaintenance: NextMaintenance;
  status: MaintenanceHealthStatus;
}

// MaintenanceRecordEntity con maintenanceType incluido por el backend.
export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  maintenanceTypeId: string;
  workshopId: string | null;
  registeredById: string;
  serviceDate: string;
  kilometers: number;
  cost: number | null;
  observations: string | null;
  createdAt: string;
  maintenanceType: MaintenanceType;
}

// Respuesta de POST /workshops/vehicles/:id/maintenance.
export interface CreatedMaintenance {
  record: MaintenanceRecord;
  nextMaintenance: NextMaintenance;
}

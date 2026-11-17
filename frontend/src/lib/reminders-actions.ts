'use server';

import { redirect } from 'next/navigation';
import type { ReminderCriteria } from '@/types/reminder';
import {
  completeReminder,
  createReminder,
  type CreateReminderBody,
} from './reminders';
import { requireOwner } from './session';
import { hoyISO } from './taller';
import { isUuid } from './uuid';

function texto(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function entero(raw: string): number | undefined {
  if (raw === '') return undefined;

  const value = Number(raw);

  return Number.isInteger(value) && value >= 0 ? value : Number.NaN;
}

function esInvalido(value: number | undefined): boolean {
  return value !== undefined && Number.isNaN(value);
}

function esCriterio(value: string): value is ReminderCriteria {
  return value === 'due_date' || value === 'due_kilometers';
}

function volverAlFormulario(vehicleId: string, error: string): never {
  redirect(`/garaje/${vehicleId}/recordatorios/nuevo?error=${error}`);
}

function volverACompletar(
  vehicleId: string,
  reminderId: string,
  error: string,
): never {
  redirect(
    `/garaje/${vehicleId}/recordatorios/${reminderId}/completar?error=${error}`,
  );
}

export async function createReminderAction(formData: FormData) {
  await requireOwner();

  const vehicleId = texto(formData, 'vehicleId');

  if (!isUuid(vehicleId)) redirect('/garaje');

  const title = texto(formData, 'title');
  const description = texto(formData, 'description');
  const maintenanceTypeId = texto(formData, 'maintenanceTypeId');
  const criteria = texto(formData, 'criteria');
  const dueDate = texto(formData, 'dueDate');
  const dueKilometers = entero(texto(formData, 'dueKilometers'));
  const leadDays = entero(texto(formData, 'leadDays'));
  const leadKilometers = entero(texto(formData, 'leadKilometers'));
  const recurring = formData.get('recurring') === 'on';
  const recurrenceDays = entero(texto(formData, 'recurrenceDays'));
  const recurrenceKm = entero(texto(formData, 'recurrenceKm'));

  if (!title || title.length > 150) volverAlFormulario(vehicleId, 'titulo');
  if (description.length > 2000) volverAlFormulario(vehicleId, 'descripcion');
  if (!esCriterio(criteria)) volverAlFormulario(vehicleId, 'criterio');

  if (maintenanceTypeId && !isUuid(maintenanceTypeId)) {
    volverAlFormulario(vehicleId, 'tipo');
  }

  if (criteria === 'due_date') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      volverAlFormulario(vehicleId, 'fecha');
    }

    if (dueDate < hoyISO()) volverAlFormulario(vehicleId, 'fecha_pasada');
  }

  if (
    criteria === 'due_kilometers' &&
    (dueKilometers === undefined || esInvalido(dueKilometers))
  ) {
    volverAlFormulario(vehicleId, 'km');
  }

  if (esInvalido(leadDays) || esInvalido(leadKilometers)) {
    volverAlFormulario(vehicleId, 'anticipacion');
  }

  if (recurring) {
    const cycle = criteria === 'due_date' ? recurrenceDays : recurrenceKm;

    if (cycle === undefined || Number.isNaN(cycle) || cycle < 1) {
      volverAlFormulario(vehicleId, 'recurrencia');
    }
  }

  const body: CreateReminderBody = { title, criteria, recurring };

  if (description) body.description = description;
  if (maintenanceTypeId) body.maintenanceTypeId = maintenanceTypeId;
  if (leadDays !== undefined) body.leadDays = leadDays;
  if (leadKilometers !== undefined) body.leadKilometers = leadKilometers;

  if (criteria === 'due_date') {
    body.dueDate = dueDate;
    if (recurring) body.recurrenceDays = recurrenceDays;
  } else {
    body.dueKilometers = dueKilometers;
    if (recurring) body.recurrenceKm = recurrenceKm;
  }

  const result = await createReminder(vehicleId, body);

  if (result.status === 0) volverAlFormulario(vehicleId, 'conexion');
  if (result.status === 403) volverAlFormulario(vehicleId, 'acceso');
  if (result.status === 404) volverAlFormulario(vehicleId, 'vehiculo');
  if (!result.ok) volverAlFormulario(vehicleId, 'datos');

  redirect(`/garaje/${vehicleId}/recordatorios?ok=creado`);
}

export async function completeReminderAction(formData: FormData) {
  await requireOwner();

  const vehicleId = texto(formData, 'vehicleId');
  const reminderId = texto(formData, 'reminderId');

  if (!isUuid(vehicleId)) redirect('/garaje');
  if (!isUuid(reminderId)) redirect(`/garaje/${vehicleId}/recordatorios`);

  const kilometers = entero(texto(formData, 'kilometers'));

  if (esInvalido(kilometers)) volverACompletar(vehicleId, reminderId, 'km');

  const result = await completeReminder(
    reminderId,
    kilometers === undefined ? {} : { kilometers },
  );

  if (result.status === 0) volverACompletar(vehicleId, reminderId, 'conexion');
  if (result.status === 403) volverACompletar(vehicleId, reminderId, 'acceso');
  if (result.status === 404) {
    volverACompletar(vehicleId, reminderId, 'no_encontrado');
  }
  if (result.status === 409) volverACompletar(vehicleId, reminderId, 'estado');
  if (result.status === 400) volverACompletar(vehicleId, reminderId, 'km');
  if (!result.ok) volverACompletar(vehicleId, reminderId, 'datos');

  redirect(`/garaje/${vehicleId}/recordatorios?ok=completado`);
}

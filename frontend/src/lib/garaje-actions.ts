'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { bitaFetch } from './bita-api';
import { unirTaller } from './garaje-formato';
import { requireOwner } from './session';

// Mismas reglas del CreateVehicleDto del backend.
const PLACA_PATTERN = /^[A-Za-z0-9-]{1,10}$/;
const MAX_OBSERVACIONES = 2000;

function texto(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function volverANuevoVehiculo(error: string): never {
  redirect(`/garaje/nuevo?error=${error}`);
}

function volverARegistro(vehicleId: string, error: string): never {
  redirect(`/garaje/${vehicleId}/mantenimiento/nuevo?error=${error}`);
}

// Agregar vehículo: POST /vehicles
export async function createVehicleAction(formData: FormData) {
  await requireOwner();

  const plate = texto(formData, 'plate').toUpperCase();
  const brand = texto(formData, 'brand');
  const model = texto(formData, 'model');
  const yearRaw = texto(formData, 'year');
  const kmRaw = texto(formData, 'currentKilometers');

  if (!PLACA_PATTERN.test(plate)) volverANuevoVehiculo('placa');
  if (!brand || brand.length > 60) volverANuevoVehiculo('marca');
  if (!model || model.length > 60) volverANuevoVehiculo('modelo');

  const year = yearRaw === '' ? undefined : Number(yearRaw);
  if (
    year !== undefined &&
    (!Number.isInteger(year) || year < 1900 || year > 2100)
  ) {
    volverANuevoVehiculo('anio');
  }

  const currentKilometers = kmRaw === '' ? undefined : Number(kmRaw);
  if (
    currentKilometers !== undefined &&
    (!Number.isInteger(currentKilometers) || currentKilometers < 0)
  ) {
    volverANuevoVehiculo('km');
  }

  const result = await bitaFetch<{ id: string }>('/vehicles', {
    method: 'POST',
    body: JSON.stringify({
      plate,
      brand,
      model,
      ...(year === undefined ? {} : { year }),
      ...(currentKilometers === undefined ? {} : { currentKilometers }),
    }),
    redirectOn401: false,
  });

  if (result.status === 0) volverANuevoVehiculo('conexion');
  if (result.status === 409) volverANuevoVehiculo('duplicada');
  if (!result.ok) volverANuevoVehiculo('datos');

  revalidatePath('/garaje');
  redirect('/garaje?nuevo=1');
}

// Registrar mantenimiento como dueño: POST /vehicles/:id/maintenance
export async function registerOwnerMaintenanceAction(formData: FormData) {
  await requireOwner();

  const vehicleId = texto(formData, 'vehicleId');
  const maintenanceTypeId = texto(formData, 'maintenanceTypeId');
  const serviceDate = texto(formData, 'serviceDate');
  const kmRaw = texto(formData, 'kilometers');
  const costRaw = texto(formData, 'cost');
  // El nombre del taller se guarda como primera línea de las observaciones
  // porque el backend no tiene ese campo (ver lib/garaje-formato.ts).
  const observations = unirTaller(
    texto(formData, 'workshopName'),
    texto(formData, 'observations'),
  );

  if (!vehicleId) redirect('/garaje');

  if (!maintenanceTypeId || !serviceDate || !kmRaw) {
    volverARegistro(vehicleId, 'campos');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(serviceDate)) {
    volverARegistro(vehicleId, 'fecha');
  }

  const kilometers = Number(kmRaw);
  if (!Number.isInteger(kilometers) || kilometers < 0) {
    volverARegistro(vehicleId, 'km');
  }

  const cost = costRaw === '' ? undefined : Number(costRaw);
  if (
    cost !== undefined &&
    (!Number.isFinite(cost) || cost < 0 || !/^\d+(\.\d{1,2})?$/.test(costRaw))
  ) {
    volverARegistro(vehicleId, 'costo');
  }

  if (observations.length > MAX_OBSERVACIONES) {
    volverARegistro(vehicleId, 'observaciones');
  }

  const result = await bitaFetch(`/vehicles/${vehicleId}/maintenance`, {
    method: 'POST',
    body: JSON.stringify({
      maintenanceTypeId,
      serviceDate,
      kilometers,
      ...(cost === undefined ? {} : { cost }),
      ...(observations ? { observations } : {}),
    }),
    redirectOn401: false,
  });

  if (result.status === 0) volverARegistro(vehicleId, 'conexion');
  if (!result.ok) volverARegistro(vehicleId, 'datos');

  // El backend actualiza el kilometraje y cierra recordatorios: refrescamos.
  revalidatePath('/garaje');
  revalidatePath(`/garaje/${vehicleId}`);
  redirect(`/garaje/${vehicleId}?registrado=1`);
}

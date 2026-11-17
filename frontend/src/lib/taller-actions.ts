'use server';

import { redirect } from 'next/navigation';
import { bitaFetch } from './bita-api';
import { requireWorkshop } from './session';
import { createMaintenance } from './taller';
import { buildObservaciones } from './taller-observaciones';

const MAX_OBSERVACIONES = 2000;

function texto(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function volverAlFormulario(vehicleId: string, error: string): never {
  redirect(`/taller/registrar/${vehicleId}?error=${error}`);
}

// Crear o editar el perfil comercial del taller.
export async function saveWorkshopProfileAction(formData: FormData) {
  const session = await requireWorkshop();
  const name = texto(formData, 'name');
  const businessName = texto(formData, 'businessName');
  const identification = texto(formData, 'identification');

  if (!name) redirect('/taller/perfil?error=nombre');
  if (name.length > 120) redirect('/taller/perfil?error=nombre');
  if (businessName.length > 150) redirect('/taller/perfil?error=empresa');
  if (identification.length > 40) redirect('/taller/perfil?error=nit');

  const body = JSON.stringify({ name, businessName, identification });
  const result = await bitaFetch(
    session.workshop ? '/workshops/me' : '/workshops',
    {
      method: session.workshop ? 'PATCH' : 'POST',
      body,
      redirectOn401: false,
    },
  );

  if (result.status === 0) redirect('/taller/perfil?error=conexion');
  if (!result.ok) redirect('/taller/perfil?error=datos');

  redirect('/taller/perfil?ok=1');
}

// Registra un servicio como taller autorizado con permiso de escritura.
export async function registerMaintenanceAction(formData: FormData) {
  await requireWorkshop();

  const vehicleId = texto(formData, 'vehicleId');
  const maintenanceTypeId = texto(formData, 'maintenanceTypeId');
  const serviceDate = texto(formData, 'serviceDate');
  const kilometersRaw = texto(formData, 'kilometers');
  const costRaw = texto(formData, 'cost');
  const technician = texto(formData, 'technician');
  const description = texto(formData, 'description');
  const warranty = texto(formData, 'warranty');
  const currency = texto(formData, 'currency') || 'COP';
  const parts = formData
    .getAll('parts')
    .map((part) => String(part).trim())
    .filter(Boolean);

  if (!vehicleId) redirect('/taller?error=datos');

  if (!maintenanceTypeId || !serviceDate || !kilometersRaw) {
    volverAlFormulario(vehicleId, 'campos');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(serviceDate)) {
    volverAlFormulario(vehicleId, 'fecha');
  }

  const kilometers = Number(kilometersRaw);

  if (!Number.isInteger(kilometers) || kilometers < 0) {
    volverAlFormulario(vehicleId, 'km');
  }

  const cost = costRaw === '' ? undefined : Number(costRaw);

  if (cost !== undefined && (!Number.isFinite(cost) || cost < 0)) {
    volverAlFormulario(vehicleId, 'costo');
  }

  const observations = buildObservaciones({
    technician,
    description,
    parts,
    warranty,
    currency,
  });

  if (observations.length > MAX_OBSERVACIONES) {
    volverAlFormulario(vehicleId, 'observaciones');
  }

  const result = await createMaintenance(vehicleId, {
    maintenanceTypeId,
    serviceDate,
    kilometers,
    ...(cost === undefined ? {} : { cost }),
    ...(observations ? { observations } : {}),
  });

  if (result.status === 0) volverAlFormulario(vehicleId, 'conexion');
  if (result.status === 403) volverAlFormulario(vehicleId, 'acceso');
  if (!result.ok || !result.data?.record?.id) {
    volverAlFormulario(vehicleId, 'datos');
  }

  redirect(
    `/taller/comprobante/${result.data.record.id}?vehiculo=${vehicleId}`,
  );
}

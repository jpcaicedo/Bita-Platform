import type { OwnerVehicle } from '@/types/garaje';
import { GarageIcon } from './garage-icon';

// Mensajes de ?error= de los formularios de agregar y editar vehículo.
export const ERRORES_VEHICULO: Record<string, string> = {
  placa:
    'La placa es obligatoria: máximo 10 caracteres, solo letras, números y guiones.',
  marca: 'La marca es obligatoria (máximo 60 caracteres).',
  modelo: 'El modelo es obligatorio (máximo 60 caracteres).',
  anio: 'El año debe estar entre 1900 y 2100.',
  km: 'El kilometraje debe ser un número entero mayor o igual a cero.',
  kmMenor: 'El kilometraje no puede ser menor al que ya estaba registrado.',
  duplicada: 'Ya existe un vehículo registrado con esa placa.',
  conexion: 'No pudimos conectar con el servidor. Inténtalo otra vez.',
  datos: 'El servidor rechazó los datos. Revísalos e inténtalo de nuevo.',
};

// Chips de motorización del Figma (ícono, ancho y alto del ícono).
const MOTORES = [
  { value: 'gasolina', label: 'Gasolina', icon: 'gasolina', w: 11, h: 12 },
  { value: 'diesel', label: 'Diésel', icon: 'diesel', w: 12, h: 12 },
  { value: 'hibrido', label: 'Híbrido', icon: 'hibrido', w: 10.7, h: 13.3 },
  { value: 'electrico', label: 'Eléctrico', icon: 'electrico', w: 12, h: 14.7 },
];

// Campos del vehículo. Los usan "Agregar vehículo" (vacíos) y
// "Editar vehículo" (con los datos actuales ya escritos).
export function VehicleFormFields({ vehicle }: { vehicle?: OwnerVehicle }) {
  return (
    <>
      <div className="g-garage-field">
        <label htmlFor="plate" className="g-garage-label">
          Placa / Matrícula
          <small>Obligatorio</small>
        </label>
        <div className="g-garage-input g-garage-input--plate">
          <span className="g-garage-input-icon">
            <GarageIcon name="placa" width={15} height={15} />
          </span>
          <input
            id="plate"
            name="plate"
            placeholder="Ej. ABC-123"
            maxLength={10}
            pattern="[A-Za-z0-9\-]+"
            title="Solo letras, números y guiones (máximo 10)"
            autoComplete="off"
            defaultValue={vehicle?.plate}
            required
          />
          <GarageIcon name="teclado" width={16.7} height={13.3} />
        </div>
      </div>

      <div className="g-garage-field">
        <label htmlFor="brand" className="g-garage-label">
          Marca del fabricante
        </label>
        <div className="g-garage-input">
          <span className="g-garage-input-icon">
            <GarageIcon name="marca" width={12} height={14.25} />
          </span>
          <input
            id="brand"
            name="brand"
            placeholder="Ej. Mazda, Toyota, Chevrolet"
            maxLength={60}
            defaultValue={vehicle?.brand}
            required
          />
          <GarageIcon name="selector" width={7.5} height={14.9} />
        </div>
      </div>

      <div className="g-garage-field">
        <label htmlFor="model" className="g-garage-label">
          Línea o Modelo
        </label>
        <div className="g-garage-input">
          <span className="g-garage-input-icon">
            <GarageIcon name="modelo" width={15} height={12} />
          </span>
          <input
            id="model"
            name="model"
            placeholder="Ej. CX-5 Grand Touring"
            maxLength={60}
            defaultValue={vehicle?.model}
            required
          />
        </div>
      </div>

      <div className="g-garage-grid-2">
        <div className="g-garage-field">
          <label htmlFor="year" className="g-garage-label">
            Año
          </label>
          <div className="g-garage-input">
            <span className="g-garage-input-icon">
              <GarageIcon name="calendario" width={13.5} height={15} />
            </span>
            <input
              id="year"
              name="year"
              type="number"
              placeholder="Ej. 2022"
              min={1900}
              max={2100}
              step={1}
              defaultValue={vehicle?.year ?? undefined}
            />
          </div>
        </div>
        <div className="g-garage-field">
          <label htmlFor="currentKilometers" className="g-garage-label">
            Kilometraje
          </label>
          <div className="g-garage-input">
            <span className="g-garage-input-icon">
              <GarageIcon name="velocimetro" width={15} height={12} />
            </span>
            <input
              id="currentKilometers"
              name="currentKilometers"
              type="number"
              placeholder="45.000"
              min={vehicle?.currentKilometers ?? 0}
              step={1}
              defaultValue={vehicle?.currentKilometers}
            />
            <span className="g-garage-input-unit">km</span>
          </div>
        </div>
      </div>

      <fieldset
        className="g-garage-chips-wrap"
        style={{ border: 0, margin: 0, padding: '8px 0 0' }}
      >
        <legend
          className="g-garage-label"
          style={{ width: '100%', marginBottom: 8 }}
        >
          Tipo de motorización
          <small>Opcional</small>
        </legend>
        <div className="g-garage-motor">
          {MOTORES.map((motor, index) => (
            <label key={motor.value}>
              <input
                type="radio"
                name="fuelType"
                value={motor.value}
                defaultChecked={
                  vehicle ? vehicle.fuelType === motor.value : index === 0
                }
              />
              <span>
                <GarageIcon
                  name={motor.icon}
                  width={motor.w}
                  height={motor.h}
                />
                {motor.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}

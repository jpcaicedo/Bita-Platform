'use client';

// Es cliente porque lee el archivo que elige el dueño y lo achica en el
// navegador antes de enviarlo. Guardar la foto lo hace la server action
// uploadVehiclePhotoAction (PUT /vehicles/:id/photo), como los demás
// formularios del garaje.
import { useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { uploadVehiclePhotoAction } from '@/lib/garaje-actions';

const FOTO_POR_DEFECTO = '/garaje/foto-vehiculo.jpg';
const LADO_MAXIMO = 1000; // px del lado más largo
const MAX_FOTO = 700_000; // caracteres; el backend acepta hasta 800 000

// Achica la imagen con un canvas y la devuelve como JPEG en texto (data URL).
// Si sigue pesando mucho, baja la calidad hasta que quepa.
function achicarImagen(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo);
    const imagen = new Image();

    imagen.onload = () => {
      const escala = Math.min(
        1,
        LADO_MAXIMO / Math.max(imagen.width, imagen.height),
      );
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(imagen.width * escala);
      canvas.height = Math.round(imagen.height * escala);
      canvas
        .getContext('2d')
        ?.drawImage(imagen, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      let calidad = 0.8;
      let foto = canvas.toDataURL('image/jpeg', calidad);
      while (foto.length > MAX_FOTO && calidad > 0.3) {
        calidad -= 0.1;
        foto = canvas.toDataURL('image/jpeg', calidad);
      }
      resolve(foto);
    };

    imagen.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen'));
    };

    imagen.src = url;
  });
}

interface VehiclePhotoProps {
  vehicleId: string;
  alt: string;
  photo: string | null; // la foto guardada en el backend, o null
}

// Foto de la ficha del vehículo con el botón de vidrio para subir una propia.
export function VehiclePhoto({ vehicleId, alt, photo }: VehiclePhotoProps) {
  const form = useRef<HTMLFormElement>(null);
  const campoFoto = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function alElegir(event: React.ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0];
    event.target.value = ''; // permite volver a elegir el mismo archivo
    if (!archivo || !form.current || !campoFoto.current) return;

    if (!archivo.type.startsWith('image/')) {
      setError('Elige un archivo de imagen.');
      return;
    }

    try {
      campoFoto.current.value = await achicarImagen(archivo);
      setError(null);
      form.current.requestSubmit(); // envía el formulario a la server action
    } catch {
      setError('No pudimos leer la imagen. Prueba con otra.');
    }
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo ?? FOTO_POR_DEFECTO} alt={alt} />

      <form ref={form} action={uploadVehiclePhotoAction}>
        <input type="hidden" name="vehicleId" value={vehicleId} />
        <input ref={campoFoto} type="hidden" name="photo" />
        <BotonFoto tieneFoto={photo !== null} onElegir={alElegir} />
      </form>

      {error && (
        <span className="g-garage-photo-error" role="alert">
          {error}
        </span>
      )}
    </>
  );
}

// Va aparte porque useFormStatus solo funciona dentro del <form>.
function BotonFoto({
  tieneFoto,
  onElegir,
}: {
  tieneFoto: boolean;
  onElegir: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const { pending } = useFormStatus();

  let texto = tieneFoto ? 'Cambiar foto' : 'Sube la foto de tu vehículo';
  if (pending) texto = 'Subiendo foto…';

  return (
    <label
      className={`g-garage-photo-upload ${
        tieneFoto ? 'g-garage-photo-upload--small' : ''
      }`}
      aria-disabled={pending}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
        <circle cx="12" cy="13" r="3" />
      </svg>
      {texto}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onElegir}
        disabled={pending}
        className="g-garage-photo-input"
      />
    </label>
  );
}

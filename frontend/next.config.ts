import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

// El repo tiene dos package-lock.json (backend y frontend). Le decimos a
// Turbopack que la raíz del front es esta carpeta para evitar el warning.
const currentDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // El botón flotante de desarrollo ("1 Insight") no aporta a la experiencia
  // de la app; los errores de compilación se siguen mostrando en la terminal.
  devIndicators: false,
  turbopack: {
    root: currentDir,
  },
};

export default nextConfig;

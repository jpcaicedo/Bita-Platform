import type { CSSProperties } from 'react';

interface GarageIconProps {
  name: string; // archivo en /public/garaje sin ".svg"
  width: number;
  height: number;
  className?: string;
}

/**
 * Íconos del Figma. Se pintan con una "máscara" CSS: así el mismo SVG toma
 * el color del texto (currentColor) y sirve en blanco, azul o naranja.
 */
export function GarageIcon({
  name,
  width,
  height,
  className,
}: GarageIconProps) {
  const style = {
    '--g-garage-icon': `url(/garaje/${name}.svg)`,
    width,
    height,
  } as CSSProperties;

  return (
    <span
      className={`g-garage-icon ${className ?? ''}`}
      style={style}
      aria-hidden="true"
    />
  );
}
// Íconos SVG en línea. No son una dependencia: son componentes de React.
interface IconProps {
  size?: number;
  className?: string;
}

function base(size = 20, className?: string) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  };
}

export function MailIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="3" y="5" width="18" height="14" rx="4" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function LockIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="4" y="10" width="16" height="11" rx="3" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <circle cx="12" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function UserIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c.7-3.4 3.4-5.2 7-5.2s6.3 1.8 7 5.2" />
    </svg>
  );
}

export function CarIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M4 16.5h16v-3l-1.8-4.2a2 2 0 0 0-1.8-1.2H7.6a2 2 0 0 0-1.8 1.2L4 13.5v3Z" />
      <path d="M4 13.5h16" />
      <circle cx="7.5" cy="17.5" r="1.6" />
      <circle cx="16.5" cy="17.5" r="1.6" />
      <path d="M6 8.1 7 5.5h10l1 2.6" />
    </svg>
  );
}

export function SearchIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

export function BellIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M6 17h12l-1.4-2.1a2 2 0 0 1-.3-1V10a4.3 4.3 0 0 0-8.6 0v3.9a2 2 0 0 1-.3 1L6 17Z" />
      <path d="M10.3 20a2 2 0 0 0 3.4 0" />
    </svg>
  );
}

export function SettingsIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </svg>
  );
}

export function HistoryIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M4 12a8 8 0 1 0 2.3-5.7" />
      <path d="M4 5v5h5" />
      <path d="M12 8v4l2.6 1.7" />
    </svg>
  );
}

export function WorkshopIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M3 20V9.5l9-5 9 5V20" />
      <path d="M9 20v-6.5h6V20" />
      <path d="M3 20h18" />
    </svg>
  );
}

export function PlusIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function BackIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </svg>
  );
}

export function CheckIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function ShieldIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="m12 3 7 3v5.5c0 4.3-2.8 7.7-7 9.5-4.2-1.8-7-5.2-7-9.5V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function DollarIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 3v18" />
      <path d="M16.5 7.2c-.7-1-2-1.7-3.7-1.7-2.3 0-3.8 1.1-3.8 2.8 0 4.3 8 2 8 6.4 0 1.8-1.7 3.1-4.2 3.1-2 0-3.5-.8-4.3-2" />
    </svg>
  );
}

export function ArrowRightIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function CalendarIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </svg>
  );
}

export function WrenchIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M14.5 6.2a4.2 4.2 0 0 0-5.6 5.2L4 16.3a2.2 2.2 0 0 0 3.1 3.1l4.9-4.9a4.2 4.2 0 0 0 5.2-5.6l-2.6 2.6-2.3-2.3 2.2-3Z" />
    </svg>
  );
}

export function GaugeIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M4.5 17.5a8.5 8.5 0 1 1 15 0" />
      <path d="M12 16 16 9.5" />
      <circle cx="12" cy="17.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TrashIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M4.5 6.5h15M9 6.5V4.5h6v2M6.5 6.5l.8 13h9.4l.8-13" />
      <path d="M10 10.5v5.5M14 10.5v5.5" />
    </svg>
  );
}

export function DocumentIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M6 3.5h8l4 4v13H6v-17Z" />
      <path d="M14 3.5v4h4M9 12h6M9 15.5h6" />
    </svg>
  );
}

export function ChevronRightIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}


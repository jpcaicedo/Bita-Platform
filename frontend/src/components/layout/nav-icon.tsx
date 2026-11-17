import {
  CarIcon,
  HistoryIcon,
  PlusIcon,
  SettingsIcon,
  WorkshopIcon,
} from '@/components/ui/icons';
import type { NavLink } from '@/lib/nav-links';

export function NavIcon({ name }: { name: NavLink['icon'] }) {
  const size = 20;

  switch (name) {
    case 'cars':
      return <CarIcon size={size} />;
    case 'history':
      return <HistoryIcon size={size} />;
    case 'plus':
      return <PlusIcon size={24} />;
    case 'workshops':
      return <WorkshopIcon size={size} />;
    case 'settings':
      return <SettingsIcon size={size} />;
  }
}

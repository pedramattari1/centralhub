import {
  Building2,
  FileText,
  MessageSquare,
  Headphones,
  Target,
  Car,
  DoorOpen,
  Mail,
  Hash,
  Shield,
  Users,
  LayoutGrid,
} from 'lucide-react';

// Maps a stored iconName to a Lucide component. Falls back to LayoutGrid.
const ICONS = {
  Building2,
  FileText,
  MessageSquare,
  Headphones,
  Target,
  Car,
  DoorOpen,
  Mail,
  Hash,
  Shield,
  Users,
};

// Icon names offered in the admin platform form.
export const ICON_OPTIONS = Object.keys(ICONS);

export function getIcon(name) {
  return ICONS[name] || LayoutGrid;
}

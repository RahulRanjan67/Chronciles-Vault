/**
 * Navigation item definitions for Sidebar.
 * Extracted to a separate file so Sidebar.tsx can be Vite Fast Refresh compatible.
 */
import {
  Archive,
  BookOpen,
  Compass,
  HardDrive,
  HelpCircle,
  ListFilter,
  type LucideIcon,
  MessageSquare,
  Radar,
  RotateCcw,
  Settings,
  Sparkles,
  Tag,
  Users,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number | string | undefined;
}

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { id: 'library', label: 'Library', href: '/', icon: BookOpen },
  { id: 'return', label: 'Return Desk', href: '/return-desk', icon: RotateCcw },
  { id: 'radar', label: 'Radar', href: '/radar', icon: Radar },
  { id: 'shelf', label: 'Local Shelf', href: '/shelf', icon: HardDrive },
  { id: 'memory', label: 'Memory', href: '/memory', icon: MessageSquare },
  { id: 'updates', label: 'Updates', href: '/updates', icon: Sparkles },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { id: 'friends', label: 'Friends & Shelves', href: '/friends', icon: Users },
  { id: 'categories', label: 'My Categories', href: '/categories', icon: Tag },
  { id: 'lists', label: 'Lists', href: '/lists', icon: ListFilter },
  { id: 'archive', label: 'Archive', href: '/archive', icon: Archive },
  { id: 'discover', label: 'Discover', href: '/discover', icon: Compass },
];

export const TERTIARY_NAV_ITEMS: NavItem[] = [
  { id: 'settings', label: 'Settings', href: '/settings', icon: Settings },
  { id: 'help', label: 'Help & Guide', href: '/help', icon: HelpCircle },
];

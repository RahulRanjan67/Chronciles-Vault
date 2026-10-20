/**
 * Navigation item definitions for BottomNav.
 * Extracted to a separate file so BottomNav.tsx can be Vite Fast Refresh compatible.
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
  Trash2,
} from 'lucide-react';

export interface BottomNavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number | string | undefined;
}

/** Tabs pinned to the visible bar: the five most frequently used destinations. */
export const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { id: 'library', label: 'Library', href: '/', icon: BookOpen },
  { id: 'updates', label: 'Updates', href: '/updates', icon: Sparkles },
  { id: 'return', label: 'Return', href: '/return-desk', icon: RotateCcw },
  { id: 'shelf', label: 'Shelf', href: '/shelf', icon: HardDrive },
  { id: 'memory', label: 'Memory', href: '/memory', icon: MessageSquare },
];

/**
 * Every other section reachable from the desktop Sidebar.
 * Opens in a "More" bottom sheet instead of crowding the five-tab bar.
 */
export const MORE_NAV_ITEMS: BottomNavItem[] = [
  { id: 'radar', label: 'Radar', href: '/radar', icon: Radar },
  { id: 'categories', label: 'My Categories', href: '/categories', icon: Tag },
  { id: 'lists', label: 'Lists', href: '/lists', icon: ListFilter },
  { id: 'archive', label: 'Archive', href: '/archive', icon: Archive },
  { id: 'trash', label: 'Trash Bin', href: '/trash', icon: Trash2 },
  { id: 'settings', label: 'Settings', href: '/settings', icon: Settings },
  { id: 'help', label: 'Help & Guide', href: '/help', icon: HelpCircle },
];

import type { Config } from 'tailwindcss';
import { cvTokens } from '@chronicles-vault/ui/tailwind';

export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
    '../../packages/ui/src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      ...cvTokens,
    },
  },
  plugins: [],
} satisfies Config;

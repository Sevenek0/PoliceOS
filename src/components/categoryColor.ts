import type { AtlasCategoryColor } from '../types';

export const CATEGORY_COLOR_CLASSES: Record<AtlasCategoryColor, string> = {
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
  success: 'bg-success-soft text-success',
  accent: 'bg-accent-soft text-accent-ink',
  purple: 'bg-[#241236] text-[#c084fc]',
  pink: 'bg-[#331420] text-[#fb7195]',
};

const PALETTE: AtlasCategoryColor[] = ['danger', 'accent', 'warning', 'success', 'purple', 'pink'];

/** Deterministically assigns a color to a category key so the same category always gets the same color. */
export function colorForCategoryKey(key: string): AtlasCategoryColor {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

/**
 * Class Name utility for conditional styling
 * Lightweight alternative to clsx/classnames
 */

export function cn(...classes) {
  return classes
    .filter(Boolean)
    .join(' ')
    .trim();
}
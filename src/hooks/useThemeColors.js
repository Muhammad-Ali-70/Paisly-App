import { getColors } from '@constants/colors';
import { useResolvedTheme } from './useResolvedTheme';

/**
 * Returns the active color theme object (follows system unless overridden).
 * Use this in any component to get theme-aware colors.
 */
export const useThemeColors = () => getColors(useResolvedTheme());

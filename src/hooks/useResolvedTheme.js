import { useColorScheme } from 'react-native';
import useAppStore from '@store/useAppStore';

/**
 * The theme actually in effect: 'light' or 'dark'.
 * Follows the phone unless the user picked one in Settings.
 */
export const useResolvedTheme = () => {
  const mode = useAppStore(state => state.themeMode);
  const system = useColorScheme();
  if (mode === 'light' || mode === 'dark') return mode;
  return system === 'dark' ? 'dark' : 'light';
};

export default useResolvedTheme;

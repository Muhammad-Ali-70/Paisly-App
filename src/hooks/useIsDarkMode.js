import { useResolvedTheme } from './useResolvedTheme';

/** Returns true when the active theme is 'dark'. */
export const useIsDarkMode = () => useResolvedTheme() === 'dark';

export default useIsDarkMode;

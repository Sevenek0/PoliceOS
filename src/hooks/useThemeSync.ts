import { useEffect } from 'react';
import { useOfficerProfile } from '../store/useOfficerProfile';

/** Applies the chosen accent/theme to the document root — must run app-wide,
 * not just inside the panel, so switching colors on the Landing page works too. */
export function useThemeSync() {
  const accent = useOfficerProfile((s) => s.accent);
  const theme = useOfficerProfile((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent);
    document.documentElement.setAttribute('data-theme', theme);
  }, [accent, theme]);
}

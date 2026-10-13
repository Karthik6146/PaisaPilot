import { Capacitor, registerPlugin, SystemBars, SystemBarsStyle } from '@capacitor/core';

const AppAppearance = registerPlugin<{ setTheme(options: { theme: 'light' | 'dark' }): Promise<void> }>('AppAppearance');

export function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.dataset.theme = theme;
  if (Capacitor.isNativePlatform()) void AppAppearance.setTheme({ theme })
    .then(() => SystemBars.setStyle({ style: theme === 'dark' ? SystemBarsStyle.Dark : SystemBarsStyle.Light })).catch(() => {});
}

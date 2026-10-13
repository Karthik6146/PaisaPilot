import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.karthik.paisapilot',
  appName: 'PaisaPilot',
  webDir: 'dist',
  loggingBehavior: 'none',
  android: { allowMixedContent: false },
  plugins: { SystemBars: { style: 'LIGHT', initialViewportFitValueHint: 'cover' } },
};

export default config;

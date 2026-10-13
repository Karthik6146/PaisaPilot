import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export async function clearExpiredExports() {
  if (!Capacitor.isNativePlatform()) return;
  // Leave recent files available for the receiving app, even after the chooser closes.
  const { files } = await Filesystem.readdir({ path: 'exports', directory: Directory.Cache });
  for (const file of files) {
    if (file.type === 'file' && /^\d+-paisapilot[-_][\w.-]+$/.test(file.name) && file.mtime < Date.now() - 86400000) {
      await Filesystem.deleteFile({ path: `exports/${file.name}`, directory: Directory.Cache });
    }
  }
}

export async function exportFile(name: string, data: string, mime: string) {
  if (Capacitor.isNativePlatform()) {
    await clearExpiredExports().catch(() => {});
    const path = `exports/${Date.now()}-${name}`;
    const file = await Filesystem.writeFile({ path, data, directory: Directory.Cache, encoding: Encoding.UTF8, recursive: true });
    await Share.share({ title: 'PaisaPilot export', files: [file.uri], dialogTitle: 'Save or share your backup' });
    return;
  }
  const url = URL.createObjectURL(new Blob([data], { type: mime }));
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

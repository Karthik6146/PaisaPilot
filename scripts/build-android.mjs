import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const env = { ...process.env };
if (process.platform === 'win32') {
  const javaRoot = 'C:/Program Files/Eclipse Adoptium';
  const java21 = existsSync(javaRoot) && readdirSync(javaRoot).find(name => name.startsWith('jdk-21'));
  if (!env.JAVA_HOME && java21) env.JAVA_HOME = path.join(javaRoot, java21);
  env.ANDROID_HOME ||= path.join(env.LOCALAPPDATA, 'Android', 'Sdk');
}
if (!env.JAVA_HOME || !existsSync(env.JAVA_HOME) || !env.ANDROID_HOME || !existsSync(env.ANDROID_HOME)) {
  console.error('Install Java 21 and Android SDK 36, then set JAVA_HOME and ANDROID_HOME. See docs/ANDROID.md.');
  process.exit(1);
}
const result = process.platform === 'win32'
  ? spawnSync('cmd.exe', ['/d', '/q', '/s', '/c', '.\\gradlew.bat assembleDebug lintDebug --console=plain'], { cwd: 'android', env, stdio: 'inherit' })
  : spawnSync('./gradlew', ['assembleDebug', 'lintDebug', '--console=plain'], { cwd: 'android', env, stdio: 'inherit' });
if (result.error) console.error(result.error.message);
if (result.status !== 0) process.exit(result.status || 1);
mkdirSync('artifacts', { recursive: true });
copyFileSync('android/app/build/outputs/apk/debug/app-debug.apk', 'artifacts/PaisaPilot-debug.apk');
console.log('Test APK: ' + path.resolve('artifacts/PaisaPilot-debug.apk'));

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const rootDir = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });

const appSrc = join(rootDir, 'app');
const appDest = join(outputDir, 'app');
if (existsSync(appSrc)) {
  cpSync(appSrc, appDest, { recursive: true });
}

const screenshotsSrc = join(rootDir, 'screenshots');
const screenshotsDest = join(outputDir, 'screenshots');
mkdirSync(screenshotsDest, { recursive: true });
if (existsSync(screenshotsSrc)) {
  cpSync(screenshotsSrc, screenshotsDest, { recursive: true });
}

const dossierBytes = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});

writeFileSync(join(outputDir, 'dossier.json'), dossierBytes);

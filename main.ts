// PANEL HEAT entry packager.
//
// I wrote this entrypoint to turn the static studio in app/ plus the
// renders in screenshots/ into the single dossier.json file that
// make.fun scores. It does no network work and has no build step:
// it mirrors the two folders into the output directory, then asks
// the vendored library to describe that mirror as a dossier.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// Where this file lives is the repo root; every input hangs off it.
const here = path.dirname(fileURLToPath(import.meta.url));

// Join a name onto the repo root without caring about separators.
function atRepo(...parts: string[]): string {
  return path.join(here, ...parts);
}

// Copy one folder tree into the output, but only when it is actually
// present in the repo. Missing optional folders are simply skipped.
function mirrorIfPresent(folderName: string, targetDir: string): void {
  const source = atRepo(folderName);
  if (!existsSync(source)) {
    return;
  }
  cpSync(source, targetDir, { recursive: true });
}

// The caps below come straight from the bounty's gate: they bound the
// dossier text, the screenshots, and the size of the app tree. Passing
// all of them means this program refuses exactly where the scorer
// would refuse, instead of producing a dossier that later fails.
const gateCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

// Resolve the destination: an explicit environment override wins,
// otherwise the platform's conventional /output location is used.
function pickOutputDir(): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  return fromEnv !== undefined && fromEnv !== '' ? fromEnv : '/output';
}

// Assemble the entry: prepare the output, mirror the app, make room
// for the screenshots and mirror those too, then build and save the
// dossier that describes everything that was mirrored.
function assembleEntry(): void {
  const out = pickOutputDir();
  mkdirSync(out, { recursive: true });

  mirrorIfPresent('app', path.join(out, 'app'));

  const shotsDir = path.join(out, 'screenshots');
  mkdirSync(shotsDir, { recursive: true });
  mirrorIfPresent('screenshots', shotsDir);

  const dossier = buildDossier(out, gateCaps);
  const dossierPath = path.join(out, 'dossier.json');
  writeFileSync(dossierPath, dossier);
  console.log(`wrote ${dossierPath} (${dossier.byteLength} bytes)`);
}

assembleEntry();

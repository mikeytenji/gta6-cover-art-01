import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const playwright = require('/home/hatch/workspace/makefun/tools/rig/node_modules/playwright');
import { spawn } from 'child_process';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';

const NODE = '~/workspace/scratch/node-root/usr/local/bin/node'.replace('~', process.env.HOME);

async function run() {
    const server = spawn(NODE, ['serve.ts', '--port', '8125'], {
        stdio: 'inherit',
        shell: true
    });

    await new Promise(r => setTimeout(r, 1500));

    const shots = JSON.parse(await readFile('shots.json', 'utf8'));
    const browser = await playwright.chromium.launch();

    for (const shot of shots) {
        const page = await browser.newPage({
            viewport: { width: shot.w, height: shot.h }
        });

        const url = `http://localhost:8125/${shot.query}`;
        console.log(`Taking shot: ${shot.name} from ${url}`);

        await page.goto(url);

        await page.waitForFunction(() => window.rendered === true, { timeout: 20000 });
        await new Promise(r => setTimeout(r, 400));

        const path = join('screenshots', shot.name);
        await page.screenshot({
            path,
            type: 'jpeg',
            quality: 82
        });

        const s = await stat(path);
        console.log(`${shot.name}: ${s.size} bytes`);

        await page.close();
    }

    await browser.close();
    server.kill();
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});

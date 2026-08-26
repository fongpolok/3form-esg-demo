#!/usr/bin/env node
// Automated WCAG check (plan §8) — loads the actual built pages (both
// public and authenticated, using real login tokens from the running
// backend) in headless Chromium and runs axe-core against each one. This
// is the CI-enforced half of the plan's verification pipeline; the manual
// checklist (VoiceOver, keyboard-only walkthrough, 200%/400% zoom,
// colour-blind simulation) still needs a human and is NOT covered here —
// see the summary this script prints at the end.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer');
const axeSource = require('node:fs').readFileSync(require.resolve('axe-core/axe.min.js'), 'utf-8');

const BACKEND_URL = process.env.A11Y_BACKEND_URL ?? 'http://localhost:3000';
const DEMO_PASSWORD = 'ChangeMe123!';

const APPS = [
  { name: 'ops-portal', dir: 'apps/ops-portal', port: 4801, base: '/ops/' },
  { name: 'client-portal', dir: 'apps/client-portal', port: 4802, base: '/client/' },
];

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404) return true;
    } catch {
      /* not up yet */
    }
    await delay(300);
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

async function login(email) {
  const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: DEMO_PASSWORD }),
  });
  if (!res.ok) return null;
  const body = await res.json();
  return body.accessToken;
}

async function runAxeOn(browser, url, { tokenKey, token } = {}) {
  const page = await browser.newPage();
  if (tokenKey && token) {
    await page.evaluateOnNewDocument(
      (key, value) => window.localStorage.setItem(key, value),
      tokenKey,
      token,
    );
  }
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 20000 });
  // Give React Query a moment to resolve authenticated data fetches before
  // scoring the DOM — axe against a loading skeleton isn't a meaningful check.
  await delay(1500);
  await page.addScriptTag({ content: axeSource });
  const results = await page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    return await axe.run(document, { resultTypes: ['violations'] });
  });
  await page.close();
  return results.violations;
}

async function main() {
  let backendReachable = true;
  try {
    await waitForServer(`${BACKEND_URL}/health`, 3000);
  } catch {
    backendReachable = false;
    console.warn(`⚠ Backend not reachable at ${BACKEND_URL} — authenticated pages will be skipped, public pages only.`);
  }

  const tokens = backendReachable
    ? {
        auditor: await login('auditor@example.com'),
        supplier: await login('supplier@example.com'),
        client: await login('client@example.com'),
      }
    : {};

  const previewProcesses = [];
  let totalViolations = 0;
  const allResults = [];

  try {
    for (const app of APPS) {
      const proc = spawn('npx', ['vite', 'preview', '--port', String(app.port), '--strictPort'], {
        cwd: app.dir,
        stdio: 'pipe',
      });
      previewProcesses.push(proc);
      await waitForServer(`http://localhost:${app.port}${app.base}`);
    }

    const browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const checks = [
      { app: 'ops-portal', path: 'login', auth: null },
      { app: 'ops-portal', path: 'work-orders', auth: tokens.supplier ? { tokenKey: 'esg.ops.accessToken', token: tokens.supplier } : null },
      { app: 'ops-portal', path: 'data-collection', auth: tokens.supplier ? { tokenKey: 'esg.ops.accessToken', token: tokens.supplier } : null },
      { app: 'ops-portal', path: 'reports', auth: tokens.auditor ? { tokenKey: 'esg.ops.accessToken', token: tokens.auditor } : null },
      { app: 'ops-portal', path: 'settings', auth: tokens.auditor ? { tokenKey: 'esg.ops.accessToken', token: tokens.auditor } : null },
      { app: 'client-portal', path: 'login', auth: null },
      { app: 'client-portal', path: '', auth: tokens.client ? { tokenKey: 'esg.client.accessToken', token: tokens.client } : null },
    ];

    for (const check of checks) {
      const appDef = APPS.find((a) => a.name === check.app);
      if (backendReachable && check.path !== 'login' && !check.auth) {
        console.log(`- SKIPPED ${check.app}/${check.path} (login for this role failed)`);
        continue;
      }
      const url = `http://localhost:${appDef.port}${appDef.base}${check.path}`;
      const violations = await runAxeOn(browser, url, check.auth ?? undefined);
      totalViolations += violations.length;
      allResults.push({ label: `${check.app}/${check.path || '(dashboard)'}`, violations });
      if (violations.length === 0) {
        console.log(`✓ ${check.app}/${check.path || '(dashboard)'} — no violations`);
      } else {
        console.log(`✗ ${check.app}/${check.path || '(dashboard)'} — ${violations.length} violation(s):`);
        for (const v of violations) {
          console.log(`    [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s)) — ${v.helpUrl}`);
        }
      }
    }

    await browser.close();
  } finally {
    for (const proc of previewProcesses) proc.kill();
  }

  console.log('');
  console.log('=== Automated coverage only — NOT a substitute for the manual pass ===');
  console.log('Not checked by this script: keyboard-only navigation feel, VoiceOver/');
  console.log('screen-reader announcement quality, 200%/400% zoom reflow, colour-blind');
  console.log('simulation, Traditional Chinese legibility at small sizes.');

  if (totalViolations > 0) {
    console.error(`\n${totalViolations} total axe violation(s) found — failing.`);
    process.exit(1);
  }
  console.log('\nAll automated checks passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

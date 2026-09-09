import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTelegramMessage, compareSnapshots, createSnapshot, formatChangeReport } from './detect-changes.js';
import { fetchPages } from './fetch-pages.js';
import { normalizePage } from './normalize.js';
import { readState, writeState } from './state.js';
import { sendTelegramMessage } from './telegram.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = new Set(argv);

  return {
    bootstrap: args.has('--bootstrap'),
    dryRun: args.has('--dry-run'),
    testTelegram: args.has('--test-telegram')
  };
}

function resolveStateFile() {
  const configured = process.env.WATCH_STATE_FILE ?? 'state/latest.json';
  return path.resolve(projectRoot, configured);
}

async function runTestTelegram() {
  const timestamp = new Date().toISOString();
  await sendTelegramMessage(`BA_bot Telegram test. ${timestamp}`);
  console.log('Telegram test message sent successfully.');
}

async function runWatcher(options) {
  const stateFile = resolveStateFile();
  const previousState = await readState(stateFile);
  const fetchedPages = await fetchPages();
  const normalizedPages = fetchedPages.map(normalizePage);
  const snapshot = createSnapshot(normalizedPages);
  const hasBaseline = Object.keys(previousState.pages).length > 0;

  if (options.bootstrap || !hasBaseline) {
    await writeState(stateFile, snapshot);
    console.log(hasBaseline ? 'Baseline refreshed without notification.' : 'Initial baseline created without notification.');
    return;
  }

  const report = compareSnapshots(previousState, snapshot);
  console.log(formatChangeReport(report));

  if (!report.hasChanges) {
    return;
  }

  if (options.dryRun) {
    console.log('Dry run enabled, state file left unchanged and no Telegram alert sent.');
    return;
  }

  await sendTelegramMessage(buildTelegramMessage(report));
  await writeState(stateFile, snapshot);
  console.log('Telegram alert sent and baseline updated.');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.testTelegram) {
    await runTestTelegram();
    return;
  }

  await runWatcher(options);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
#!/usr/bin/env node
// scripts/fetch-data.js
// Fetches all LLM data from api.zeroeval.com and writes to data/ directory.
// No npm dependencies — uses Node.js built-in fetch (Node 18+).

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://api.zeroeval.com';
const DATA_DIR = path.join(__dirname, '..', 'data');
const ARENA_NAMES = 'chat-arena,text-to-text,text-to-website,text-to-game,p5-animation,threejs,dataviz,tonejs';
const DELAY_MS = 150; // between requests to be polite
const MAX_RETRIES = 3;

function sanitizeId(modelId) {
  return modelId.replace(/\//g, '--').replace(/\s+/g, '-');
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`  Retry ${i+1}/${retries} for ${url}: ${err.message}`);
      await sleep(1000 * (i + 1));
    }
  }
}

async function main() {
  // Create directories
  fs.mkdirSync(path.join(DATA_DIR, 'details'), { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, 'arena'), { recursive: true });

  // Step 1: Fetch model list
  console.log('Fetching model list...');
  const models = await fetchWithRetry(`${BASE_URL}/leaderboard/models/full?justCanonicals=true`);
  fs.writeFileSync(path.join(DATA_DIR, 'models.json'), JSON.stringify(models, null, 2));
  console.log(`  Wrote data/models.json (${models.length} models)`);

  // Step 2: Fetch per-model detail + arena scores
  let detailOk = 0, detailFail = 0, arenaOk = 0, arenaFail = 0;

  for (let i = 0; i < models.length; i++) {
    const { model_id } = models[i];
    const safe = sanitizeId(model_id);
    console.log(`[${i+1}/${models.length}] ${model_id}`);

    // Detail
    try {
      const detail = await fetchWithRetry(`${BASE_URL}/leaderboard/models/${encodeURIComponent(model_id)}`);
      fs.writeFileSync(path.join(DATA_DIR, 'details', `${safe}.json`), JSON.stringify(detail, null, 2));
      detailOk++;
    } catch (err) {
      console.error(`  DETAIL FAIL: ${err.message}`);
      detailFail++;
    }
    await sleep(DELAY_MS);

    // Arena
    try {
      const arenaUrl = `${BASE_URL}/magia/models/scores?model_ids=${encodeURIComponent(model_id)}&arena_names=${encodeURIComponent(ARENA_NAMES)}`;
      const arenaData = await fetchWithRetry(arenaUrl);
      const scores = arenaData[model_id] ?? {};
      fs.writeFileSync(path.join(DATA_DIR, 'arena', `${safe}.json`), JSON.stringify(scores, null, 2));
      arenaOk++;
    } catch (err) {
      console.error(`  ARENA FAIL: ${err.message}`);
      // Write empty object so frontend doesn't need to handle missing file
      fs.writeFileSync(path.join(DATA_DIR, 'arena', `${safe}.json`), '{}');
      arenaFail++;
    }
    await sleep(DELAY_MS);
  }

  // Write metadata (timestamp for UI display)
  const meta = { lastUpdated: new Date().toISOString() };
  fs.writeFileSync(path.join(DATA_DIR, 'meta.json'), JSON.stringify(meta, null, 2));
  console.log('  Wrote data/meta.json');

  console.log('\nDone!');
  console.log(`Details: ${detailOk} ok, ${detailFail} failed`);
  console.log(`Arena:   ${arenaOk} ok, ${arenaFail} failed`);
  
  if (detailFail > 0 || arenaFail > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

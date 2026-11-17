#!/usr/bin/env node
'use strict';

const REQUESTS = 10;

function usage() {
  console.error('Usage: node speedtest.js <url>');
  process.exit(1);
}

async function download(url) {
  const start = process.hrtime.bigint();
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { 'User-Agent': 'speedtest-cli/1.0 (Node.js)' },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  let bytes = 0;
  for await (const chunk of res.body) {
    bytes += chunk.length;
  }

  const ms = Number(process.hrtime.bigint() - start) / 1e6;
  return { bytes, ms };
}

function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(2)} ${units[i]}`;
}

async function main() {
  const url = process.argv[2];
  if (!url) usage();

  try {
    new URL(url);
  } catch {
    console.error(`Invalid URL: ${url}`);
    process.exit(1);
  }

  console.log(`URL: ${url}`);
  console.log(`Requests: ${REQUESTS} (sequential)\n`);

  let totalBytes = 0;
  let totalMs = 0;

  for (let i = 1; i <= REQUESTS; i++) {
    try {
      const { bytes, ms } = await download(url);
      totalBytes += bytes;
      totalMs += ms;
      console.log(
        `#${String(i).padStart(2)}  ${ms.toFixed(1).padStart(9)} ms  ${formatBytes(bytes).padStart(10)}`
      );
    } catch (err) {
      console.error(`#${String(i).padStart(2)}  failed: ${err.cause?.message || err.message}`);
      process.exit(1);
    }
  }

  const avgMs = totalMs / REQUESTS;
  const seconds = totalMs / 1000;
  const mbPerSec = totalBytes / (1024 * 1024) / seconds;
  const mbitPerSec = (totalBytes * 8) / 1e6 / seconds;

  console.log('\n--- Results ---');
  console.log(`Average request time: ${avgMs.toFixed(1)} ms`);
  console.log(`Total downloaded:     ${formatBytes(totalBytes)} (${totalBytes} bytes)`);
  console.log(`Download speed:       ${mbPerSec.toFixed(2)} MB/s (${mbitPerSec.toFixed(2)} Mbit/s)`);
}

main();
